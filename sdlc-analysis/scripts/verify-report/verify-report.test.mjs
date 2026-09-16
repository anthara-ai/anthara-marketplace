/**
 * Test suite for verify-report.mjs — the mechanical half of docs/report-contract.md
 * section 6. Every test copies the passing fixture into a temp directory and
 * breaks exactly one thing, so each finding is exercised in isolation.
 * Uses Node's built-in test runner (`node --test`).
 */
import { test, describe, after } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isFaithfulRendering, parseDeck, stableStringify, textMentionsDataset, verifyReport } from "./verify-report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, "verify-report.mjs");
const PASSING_RUN = resolve(__dirname, "__fixtures__", "passing-run");

const tempDirs = [];
after(() => tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

/** Copies the passing fixture into an isolated run directory the test may break. */
function copyOfPassingRun() {
  const dir = mkdtempSync(join(tmpdir(), "verify-report-test-"));
  tempDirs.push(dir);
  cpSync(PASSING_RUN, dir, { recursive: true });
  return dir;
}

function reportPath(runDir, ...segments) {
  return join(runDir, "report", ...segments);
}

function readLedger(runDir) {
  return JSON.parse(readFileSync(reportPath(runDir, "evidence-ledger.json"), "utf-8"));
}

function writeLedger(runDir, ledger) {
  writeFileSync(reportPath(runDir, "evidence-ledger.json"), JSON.stringify(ledger, null, 2));
}

function editDeck(runDir, edit) {
  const path = reportPath(runDir, "deck.html");
  writeFileSync(path, edit(readFileSync(path, "utf-8")));
}

function errors(findings) {
  return findings.filter((finding) => finding.severity === "error");
}

function warnings(findings) {
  return findings.filter((finding) => finding.severity === "warning");
}

function messagesOf(findings) {
  return findings.map((finding) => `${finding.subject}: ${finding.message}`).join("\n");
}

/** Runs the verifier as a subprocess and returns stdout plus exit code on both paths. */
function runVerifier(...args) {
  try {
    const stdout = execSync(`node "${SCRIPT_PATH}" ${args.map((arg) => `"${arg}"`).join(" ")}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return { stdout, exitCode: 0, stderr: "" };
  } catch (error) {
    return { stdout: error.stdout?.toString() ?? "", exitCode: error.status, stderr: error.stderr?.toString() ?? "" };
  }
}

describe("A deck whose every number traces to the records passes", () => {
  test("the passing fixture produces no findings and a clean exit", () => {
    const result = runVerifier(PASSING_RUN);
    assert.strictEqual(result.exitCode, 0, result.stdout);
    assert.match(result.stdout, /No findings/);
  });

  test("a run with no report directory is reported as a missing ledger, not a crash", () => {
    const dir = copyOfPassingRun();
    rmSync(join(dir, "report"), { recursive: true });
    const findings = verifyReport(dir);
    assert.strictEqual(findings.length, 1);
    assert.match(findings[0].message, /evidence-ledger\.json" is missing/);
  });
});

describe("The ledger must be well-formed and point at real files", () => {
  test("a ledger missing a required field fails the schema check", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    delete ledger.staleness_exclusions;
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /fails schema sdlc-analysis-evidence-ledger-v1/);
  });

  test("a ledger naming a deck file that does not exist is an error before anything else runs", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.deck_file = "missing.html";
    writeLedger(dir, ledger);
    const findings = verifyReport(dir);
    assert.strictEqual(findings.length, 1);
    assert.match(findings[0].message, /missing\.html does not exist/);
  });
});

describe("Metrics must be reproducible from the records by the committed script", () => {
  test("a metrics file that the script no longer reproduces is an error", () => {
    const dir = copyOfPassingRun();
    const metricsPath = reportPath(dir, "analysis", "metrics.json");
    const metrics = JSON.parse(readFileSync(metricsPath, "utf-8"));
    metrics.pull_requests.total = 5;
    writeFileSync(metricsPath, JSON.stringify(metrics));
    assert.match(messagesOf(errors(verifyReport(dir))), /does not reproduce "analysis\/metrics\.json"/);
  });

  test("a compute script that imports a third-party package is an error", () => {
    const dir = copyOfPassingRun();
    const scriptPath = reportPath(dir, "analysis", "compute.mjs");
    writeFileSync(scriptPath, `import Ajv from "ajv";\n${readFileSync(scriptPath, "utf-8")}`);
    assert.match(messagesOf(errors(verifyReport(dir))), /imports "ajv" — only node: built-ins are allowed/);
  });

  test("a compute script that reaches outside node: built-ins is never executed", () => {
    const dir = copyOfPassingRun();
    const sentinel = join(dir, "compute-was-executed");
    writeFileSync(
      reportPath(dir, "analysis", "compute.mjs"),
      `import Ajv from "ajv";\nimport { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(sentinel)}, "ran");\n`
    );
    const findings = verifyReport(dir);
    assert.match(messagesOf(errors(findings)), /imports "ajv"/);
    assert.strictEqual(existsSync(sentinel), false, "the script must not run when its imports are rejected");
  });

  test("a compute script that exits non-zero is reported with its first stderr line", () => {
    const dir = copyOfPassingRun();
    writeFileSync(reportPath(dir, "analysis", "compute.mjs"), `throw new Error("population mismatch");\n`);
    assert.match(messagesOf(errors(verifyReport(dir))), /compute\.mjs failed to run/);
  });

  test("stableStringify orders keys so two equal documents compare equal regardless of key order", () => {
    assert.strictEqual(stableStringify({ b: [1, { d: 1, c: 2 }], a: 1 }), stableStringify({ a: 1, b: [1, { c: 2, d: 1 }] }));
  });
});

describe("Every claim must resolve to a metric and render it faithfully", () => {
  test("a claim whose metric path is absent from metrics.json is an error", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.claims[0].metric = "pull_requests.nowhere";
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /metric path "pull_requests\.nowhere" does not exist/);
  });

  test("a claim whose ledger value disagrees with metrics.json is an error", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.claims[0].value = 5;
    ledger.claims[0].rendered = "5";
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /ledger value 5 does not equal metrics\.json "pull_requests\.total" = 4/);
  });

  test("a rendered percent equals its value rounded to the shown decimals", () => {
    assert.ok(isFaithfulRendering({ rendered: "62%", value: 62.13 }));
    assert.ok(isFaithfulRendering({ rendered: "62.1%", value: 62.13 }));
    assert.ok(!isFaithfulRendering({ rendered: "63%", value: 62.13 }));
  });

  test("a rendered count with thousands separators equals its value", () => {
    assert.ok(isFaithfulRendering({ rendered: "2,345 pull requests", value: 2345 }));
    assert.ok(!isFaithfulRendering({ rendered: "2,346 pull requests", value: 2345 }));
  });

  test("a rendered text with no number cannot faithfully render a numeric value", () => {
    assert.ok(!isFaithfulRendering({ rendered: "many", value: 4 }));
  });

  test("a string value must appear verbatim in the rendered text", () => {
    assert.ok(isFaithfulRendering({ rendered: "cut off after PR-812", value: "PR-812" }));
    assert.ok(!isFaithfulRendering({ rendered: "cut off after PR-813", value: "PR-812" }));
  });
});

describe("The deck and the ledger must show the same numbers", () => {
  test("a deck element whose text differs from the ledger's rendered value is an error", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace('data-claim="f1.unreviewed.share">25%', 'data-claim="f1.unreviewed.share">26%'));
    assert.match(messagesOf(errors(verifyReport(dir))), /deck shows "26%" but the ledger's rendered text is "25%"/);
  });

  test("a deck element naming a claim the ledger does not have is an error", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("<h2>Review is the slowest step</h2>", '<h2>Review is the slowest step for <span data-claim="ghost">9</span> teams</h2>'));
    assert.match(messagesOf(errors(verifyReport(dir))), /data-claim="ghost" but the ledger has no such claim/);
  });

  test("a ledger claim the deck never shows is a warning, not an error", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace('<span data-claim="f1.first-review-wait.p50">3 days</span>', "three days"));
    const findings = verifyReport(dir);
    assert.strictEqual(errors(findings).length, 0);
    assert.match(messagesOf(warnings(findings)), /f1\.first-review-wait\.p50.*never appears|never appears in the deck/);
  });

  test("a number in the deck outside any claim is listed as a warning with its surrounding words", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("<h2>Review is the slowest step</h2>", "<h2>Review is the slowest step across 12 repositories</h2>"));
    const result = runVerifier(dir);
    assert.strictEqual(result.exitCode, 0);
    assert.match(result.stdout, /\[WARN\] unclaimed: number "12" appears outside any data-claim element: "…[^"]*12 repositories[^"]*…"/);
  });

  test("numbers inside comments, scripts and styles are never counted", () => {
    const deck = parseDeck(`<!-- 42 --><style>.a{width:1920px}</style><p><span data-claim="x">7</span></p><script>var n = 1080;</script>`);
    assert.deepStrictEqual(deck.unclaimed, []);
    assert.deepStrictEqual(deck.claimed, [{ id: "x", text: "7" }]);
  });

  test("dates, dataset ids, ticket keys and slide labels are not treated as bare numbers", () => {
    const deck = parseDeck(`<p>window 2026-03-15 to 2026-09-15, a3-pull-requests.jsonl, KEY-142, p85, run 20260915T101500Z, 09:00 to 19:00</p>`);
    assert.deepStrictEqual(deck.unclaimed, []);
  });
});

describe("Truncation and unavailability must be carried into the ledger and disclosed", () => {
  test("a claim built on a truncated dataset must be marked as a lower bound", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.claims.find((claim) => claim.id === "method.commits.total").lower_bound = false;
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /method\.commits\.total.*lower_bound is false but the claim's datasets are truncated/s);
  });

  test("lower_bound_datasets must equal the truncated datasets the claims actually use", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.lower_bound_datasets = [];
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /lower_bound_datasets \[\] does not equal the truncated datasets the claims use \["a2"\]/);
  });

  test("unavailable_datasets must equal the unavailable sidecars on disk", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.unavailable_datasets = [];
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /unavailable_datasets \[\] does not equal the unavailable sidecars on disk \["d2"\]/);
  });

  test("a claim built on an unavailable dataset is an error", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.claims[0].datasets = ["d2"];
    ledger.datasets_used = ["a2", "a3", "a4", "d2"];
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /claim uses dataset "d2" which is unavailable/);
  });

  test("a truncated dataset the appendix never names is an undisclosed floor", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("a2-commits.jsonl is truncated", "some commits are missing"));
    assert.match(messagesOf(errors(verifyReport(dir))), /a2: dataset is truncated but the appendix never names it/);
  });

  test("an unavailable dataset the appendix never names is an undisclosed blind spot", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("D2 incidents: unavailable", "Incidents: unavailable"));
    assert.match(messagesOf(errors(verifyReport(dir))), /d2: dataset is unavailable but the appendix never names it/);
  });

  test("a staleness exclusion the appendix does not disclose is an error", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.staleness_exclusions = [{ domain: "a", unit: "example-org/legacy", evidence: "a2, a3: no record in the window", disclosed_as: "example-org/legacy" }];
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /staleness exclusion for domain a is not disclosed in the appendix as "example-org\/legacy"/);
  });

  test("a dataset range mention such as D1–D6 counts as naming every dataset in the range", () => {
    assert.ok(textMentionsDataset("Incidents D1–D6 were unavailable", "d3"));
    assert.ok(textMentionsDataset("see a2-commits.jsonl", "a2"));
    assert.ok(!textMentionsDataset("see a2-commits.jsonl", "a3"));
  });
});

describe("Every cited receipt must exist in the records", () => {
  test("a receipt id that occurs in no records file of its claim is an error", () => {
    const dir = copyOfPassingRun();
    const ledger = readLedger(dir);
    ledger.claims.find((claim) => claim.id === "f1.unreviewed.share").receipts = ["PR-999"];
    writeLedger(dir, ledger);
    assert.match(messagesOf(errors(verifyReport(dir))), /receipt "PR-999" does not occur in any of a3, a4/);
  });
});

describe("Deck hygiene rules from the template header", () => {
  test("an unfilled template slot is an error", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("<h2>Review is the slowest step</h2>", "<h2>{{The constraint as a sentence}}</h2>"));
    assert.match(messagesOf(errors(verifyReport(dir))), /1 unfilled "\{\{" slot\(s\) remain/);
  });

  test("an em dash in the deck text is an error", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("Percentiles, never means.", "Percentiles — never means."));
    assert.match(messagesOf(errors(verifyReport(dir))), /1 em dash\(es\) \(U\+2014\)/);
  });
});

describe("Command-line contract", () => {
  test("an invocation with no run directory exits 2 with usage on stderr", () => {
    const result = runVerifier();
    assert.strictEqual(result.exitCode, 2);
    assert.match(result.stderr, /Usage: node verify-report\.mjs <run-directory>/);
  });

  test("an unrecognized option is rejected instead of being treated as the run directory", () => {
    const result = runVerifier("--json");
    assert.strictEqual(result.exitCode, 2);
    assert.match(result.stderr, /Unrecognized option "--json"/);
  });

  test("a run with an error-severity finding exits 1 and prints the finding on stdout", () => {
    const dir = copyOfPassingRun();
    editDeck(dir, (html) => html.replace("25%", "26%"));
    const result = runVerifier(dir);
    assert.strictEqual(result.exitCode, 1);
    assert.match(result.stdout, /\[ERROR\] f1\.unreviewed\.share/);
    assert.match(result.stdout, /1 error\(s\)/);
  });
});
