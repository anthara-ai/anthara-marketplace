/**
 * Test suite for validate-run.mjs
 * Validates an sdlc-analysis extraction run directory against the slice 1
 * schemas and the cross-file invariants in docs/output-contract.md section 8.
 * Uses Node's built-in test runner (`node --test`).
 */
import { test, describe } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { main, validateRun, validateDatasetPair, checkInvariants, formatFindings } from "./validate-run.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, "validate-run.mjs");
const FIXTURES_ROOT = resolve(__dirname, "__fixtures__");
const COMPLETE_RUN = join(FIXTURES_ROOT, "complete-run");
const TRUNCATED_RUN = join(FIXTURES_ROOT, "truncated-run");
const UNAVAILABLE_RUN = join(FIXTURES_ROOT, "unavailable-run");
const CONTRADICTORY_RUN = join(FIXTURES_ROOT, "contradictory-run");

/**
 * Runs the validator as a subprocess and returns { stdout, exitCode } even
 * when the process exits non-zero — the validator signals findings through its
 * exit code, so stdout must be read via error.stdout on the failure path.
 */
function runValidator(...args) {
  try {
    const stdout = execSync(`node "${SCRIPT_PATH}" ${args.map((a) => `"${a}"`).join(" ")}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, exitCode: 0 };
  } catch (error) {
    return { stdout: error.stdout?.toString() ?? "", exitCode: error.status, stderr: error.stderr?.toString() ?? "" };
  }
}

/** Builds an isolated, auto-cleaned run directory for a single test. */
function makeTempRunDir() {
  const dir = mkdtempSync(join(tmpdir(), "validate-run-test-"));
  return dir;
}

function writeSidecarPair(dir, filenameBase, meta, lines) {
  writeFileSync(join(dir, `${filenameBase}.jsonl`), lines.length ? lines.map((l) => JSON.stringify(l)).join("\n") + "\n" : "");
  writeFileSync(join(dir, `${filenameBase}.meta.json`), JSON.stringify(meta));
}

const BASE_META = {
  dataset: "a2",
  records_file: "a2-commits.jsonl",
  provider: { name: "github", detected_via: "mcp" },
  window: { requested: "6m" },
  scope: { identifiers: ["example-org/sample-repo"] },
  completeness: "complete",
  record_count: 0,
  truncation: [],
  extracted_at: "2026-07-14T09:12:03+05:30",
};

/** A schema-valid truncation record, so a sidecar built on it fails only on the invariant under test. */
const RATE_LIMITED_TRUNCATION = {
  reason: "rate_limited",
  detail: "Provider returned 429 after the second retry",
  at: "2026-07-14T11:41:02+05:30",
  last_record_id: "412",
  last_record_timestamp: "2026-07-14T11:40:55+05:30",
  cursor: { resumable: true, resume_from: { next_page_token: "eyJvIjo0MDB9" } },
};

describe("Run validator: sidecar and records-file consistency", () => {
  test("S7.1: reports no findings for a run directory containing no datasets", async () => {
    const dir = makeTempRunDir();
    const findings = await validateRun(dir);
    assert.deepStrictEqual(findings, []);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.2: reports no findings when a single dataset's sidecar and records agree", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(dir, "a2-commits", { ...BASE_META, record_count: 2 }, [{ sha: "abc" }, { sha: "def" }]);
    const findings = await validateRun(dir);
    assert.deepStrictEqual(findings, []);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.3: reports no findings across all 24 datasets in a complete run", async () => {
    const findings = await validateRun(COMPLETE_RUN);
    assert.deepStrictEqual(findings, []);
  });

  test("S7.4: checkInvariants raises no finding when record_count exactly matches the actual line count", () => {
    const findings = checkInvariants({ ...BASE_META, record_count: 3 }, 3);
    assert.deepStrictEqual(findings, []);
  });

  test("S7.5: checkInvariants flags a sidecar whose record_count is one line off from the actual count", () => {
    const findings = checkInvariants({ ...BASE_META, record_count: 3 }, 2);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].severity, "error");
    assert.match(findings[0].message, /record_count \(3\) does not match the actual line count.*\(2\)/);
  });

  test("S7.6: validateDatasetPair reads a sidecar with its paired records file and reports their disagreement", () => {
    const dir = makeTempRunDir();
    const meta = { ...BASE_META, record_count: 10 };
    writeSidecarPair(dir, "a2-commits", meta, [{ sha: "abc" }]);
    const findings = validateDatasetPair(join(dir, "a2-commits.jsonl"), meta, "a2-commits.meta.json");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].dataset, "a2");
    assert.match(findings[0].message, /record_count \(10\)/);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.7: flags a records file that has no matching sidecar", async () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "a3-pull-requests.jsonl"), "");
    const findings = await validateRun(dir);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].dataset, "a3");
    assert.match(findings[0].message, /has no matching sidecar/);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.8: validateDatasetPair flags a malformed JSON line inside the records file", () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "a2-commits.jsonl"), '{"sha":"abc"}\nnot json\n');
    const findings = validateDatasetPair(join(dir, "a2-commits.jsonl"), { ...BASE_META, record_count: 2 }, "a2-commits.meta.json");
    const malformed = findings.find((f) => f.message.includes("line 2"));
    assert.ok(malformed, "expected a finding naming the malformed second line");
    assert.strictEqual(malformed.severity, "error");
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.9: fails a dataset whose sidecar claims complete while still carrying truncation records", () => {
    const { stdout, exitCode } = runValidator(CONTRADICTORY_RUN);
    assert.notStrictEqual(exitCode, 0);
    assert.match(stdout, /c3/);
    assert.match(stdout, /truncation/);
  });

  test("S7.10: flags the record-count drift in the truncated-run fixture", async () => {
    const findings = await validateRun(TRUNCATED_RUN);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].dataset, "a2");
    assert.match(findings[0].message, /record_count \(5\) does not match the actual line count.*\(4\)/);
  });

  test("S7.11: flags an unavailable dataset whose records file is not empty and whose gap is undocumented", async () => {
    const findings = await validateRun(UNAVAILABLE_RUN);
    assert.strictEqual(findings.length, 3);
    assert.ok(findings.every((f) => f.dataset === "d2" && f.severity === "error"));
    assert.ok(findings.some((f) => f.message.includes("must be empty")));
    assert.ok(findings.some((f) => f.message.includes("no line naming d2")));
  });

  test("S7.12: exits clean for the fully complete run fixture via the CLI", () => {
    const { stdout, exitCode } = runValidator(COMPLETE_RUN);
    assert.strictEqual(exitCode, 0);
    assert.match(stdout, /No findings/);
  });

  test("S7.13: rejects an invocation with no run-directory argument", () => {
    const { exitCode, stderr } = runValidator();
    assert.strictEqual(exitCode, 2);
    assert.match(stderr, /Usage: node validate-run\.mjs/);
  });

  test("S7.14: rejects an unrecognized flag instead of guessing which argument is the run directory", () => {
    const { exitCode, stderr } = runValidator("--verify");
    assert.strictEqual(exitCode, 2);
    assert.match(stderr, /Unrecognized flag/);
  });

  test("S7.15: main returns a non-zero exit code when the run contains an error-severity finding, and zero otherwise", async () => {
    const cleanExitCode = await main([COMPLETE_RUN]);
    const dirtyExitCode = await main([TRUNCATED_RUN]);
    assert.strictEqual(cleanExitCode, 0);
    assert.strictEqual(dirtyExitCode, 1);
  });

  test("S7.16: formatFindings renders a clean message when there are no findings", () => {
    assert.match(formatFindings([]), /No findings/);
  });

  test("S7.17: formatFindings renders one line per finding naming its severity and dataset", () => {
    const text = formatFindings([
      { severity: "error", dataset: "a2", message: "something is wrong" },
      { severity: "error", dataset: "c3", message: "something else is wrong" },
    ]);
    assert.match(text, /\[ERROR\] a2: something is wrong/);
    assert.match(text, /\[ERROR\] c3: something else is wrong/);
    assert.match(text, /2 finding\(s\), 2 error\(s\)/);
  });

  test("S7.18: validates a dataset sidecar against the real sdlc-analysis-dataset-v1 schema", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(dir, "a2-commits", { ...BASE_META, completeness: "bogus" }, []);
    const findings = await validateRun(dir);
    assert.ok(findings.some((f) => f.message.includes("sdlc-analysis-dataset-v1")));
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.19: validates _run-manifest.json against the run-manifest schema when the file is present", async () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "_run-manifest.json"), JSON.stringify({ started_at: "2026-07-14T09:00:00+05:30" }));
    const findings = await validateRun(dir);
    assert.ok(findings.some((f) => f.dataset === "_run-manifest"));
    assert.ok(findings.some((f) => f.message.includes("sdlc-analysis-run-manifest-v1")));
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.20: flags a sidecar whose records file is absent from the run directory", async () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "a2-commits.meta.json"), JSON.stringify(BASE_META));
    const findings = await validateRun(dir);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].dataset, "a2");
    assert.strictEqual(findings[0].severity, "error");
    assert.match(findings[0].message, /records file "a2-commits\.jsonl" is missing for sidecar "a2-commits\.meta\.json"/);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.21: counts the last line of a records file that does not end in a newline", async () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "a2-commits.jsonl"), '{"sha":"abc"}\n{"sha":"def"}');
    writeFileSync(join(dir, "a2-commits.meta.json"), JSON.stringify({ ...BASE_META, record_count: 2 }));
    const findings = await validateRun(dir);
    assert.deepStrictEqual(findings, []);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.22: fails a dataset whose sidecar claims unavailable while still carrying a truncation record", async () => {
    const dir = makeTempRunDir();
    writeFileSync(join(dir, "gaps.md"), "- **A2** — unavailable: no version-control MCP server is connected.\n");
    writeSidecarPair(
      dir,
      "a2-commits",
      {
        ...BASE_META,
        completeness: "unavailable",
        unavailable_reason: "no version-control MCP server is connected",
        truncation: [RATE_LIMITED_TRUNCATION],
      },
      []
    );
    const findings = await validateRun(dir);
    assert.ok(
      findings.some((f) => f.dataset === "a2" && /"\/truncation": must NOT have more than 0 items/.test(f.message)),
      `expected a schema finding rejecting truncation under "unavailable", got: ${JSON.stringify(findings)}`
    );
    rmSync(dir, { recursive: true, force: true });
  });

  /**
   * Writes a schema-valid _run-manifest.json into the temp run directory by
   * reusing the complete-run fixture's manifest as the envelope and replacing
   * only datasets[], so cross-check tests fail on the invariant under test
   * rather than on unrelated schema errors.
   */
  function writeManifest(dir, datasets) {
    const template = JSON.parse(readFileSync(join(COMPLETE_RUN, "_run-manifest.json"), "utf-8"));
    writeFileSync(join(dir, "_run-manifest.json"), JSON.stringify({ ...template, datasets }));
  }

  /** A manifest datasets[] entry that agrees with a one-record a2 sidecar. */
  const A2_MANIFEST_ENTRY = {
    dataset: "a2",
    completeness: "complete",
    record_count: 1,
    records_file: "a2-commits.jsonl",
    meta_file: "a2-commits.meta.json",
    truncation_count: 0,
  };

  test("S7.23: reports no findings when the manifest's datasets[] agrees with the sidecar on disk", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(dir, "a2-commits", { ...BASE_META, record_count: 1 }, [{ sha: "abc" }]);
    writeManifest(dir, [A2_MANIFEST_ENTRY]);
    const findings = await validateRun(dir);
    assert.deepStrictEqual(findings, []);
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.24: fails a manifest claiming complete over a sidecar that says truncated", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(
      dir,
      "a2-commits",
      { ...BASE_META, record_count: 1, completeness: "truncated", truncation: [RATE_LIMITED_TRUNCATION] },
      [{ sha: "abc" }]
    );
    writeManifest(dir, [A2_MANIFEST_ENTRY]);
    const findings = await validateRun(dir);
    assert.ok(
      findings.some((f) => f.dataset === "a2" && /completeness \("complete"\) does not match the sidecar's \("truncated"\)/.test(f.message)),
      `expected a completeness cross-check finding, got: ${JSON.stringify(findings)}`
    );
    assert.ok(
      findings.some((f) => f.dataset === "a2" && /truncation_count \(0\) does not match the sidecar's truncation\.length \(1\)/.test(f.message)),
      `expected a truncation_count cross-check finding, got: ${JSON.stringify(findings)}`
    );
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.25: fails a manifest listing a dataset that has no sidecar in the run directory", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(dir, "a2-commits", { ...BASE_META, record_count: 1 }, [{ sha: "abc" }]);
    const d1Entry = {
      dataset: "d1",
      completeness: "complete",
      record_count: 0,
      records_file: "d1-services.jsonl",
      meta_file: "d1-services.meta.json",
      truncation_count: 0,
    };
    writeManifest(dir, [A2_MANIFEST_ENTRY, d1Entry]);
    const findings = await validateRun(dir);
    assert.ok(
      findings.some((f) => f.dataset === "d1" && /no parseable sidecar/.test(f.message)),
      `expected a missing-sidecar finding for d1, got: ${JSON.stringify(findings)}`
    );
    rmSync(dir, { recursive: true, force: true });
  });

  test("S7.26: fails a manifest whose datasets[] omits a sidecar that is on disk", async () => {
    const dir = makeTempRunDir();
    writeSidecarPair(dir, "a2-commits", { ...BASE_META, record_count: 1 }, [{ sha: "abc" }]);
    writeSidecarPair(dir, "a6-branches", { ...BASE_META, dataset: "a6", records_file: "a6-branches.jsonl", record_count: 1 }, [{ name: "main" }]);
    writeManifest(dir, [A2_MANIFEST_ENTRY]);
    const findings = await validateRun(dir);
    assert.ok(
      findings.some((f) => f.dataset === "a6" && /on disk but _run-manifest\.json datasets\[\] does not list it/.test(f.message)),
      `expected an unlisted-sidecar finding for a6, got: ${JSON.stringify(findings)}`
    );
    rmSync(dir, { recursive: true, force: true });
  });
});
