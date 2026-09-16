#!/usr/bin/env node
/**
 * Validates an sdlc-analysis extraction run directory against the slice 1
 * schemas (schemas/dataset-file-schema.json, schemas/run-manifest-schema.json)
 * and the cross-file invariants fixed in docs/output-contract.md section 8.
 *
 * The schemas already enforce every invariant they can see from a single
 * sidecar alone — the completeness/truncation contradiction, the
 * "unavailable" fields, the cursor's resumable/unreachable_reason branches.
 * This script owns only what a schema structurally cannot see: whether the
 * sidecar's claims match the records file actually on disk, whether
 * every dataset's other half (sidecar or records file) is present, and
 * whether _run-manifest.json's per-dataset claims agree with the sidecars
 * they were copied from.
 *
 * Usage: node validate-run.mjs <run-directory>
 * Findings go to stdout; diagnostics (usage errors, I/O failures) go to
 * stderr, so stdout stays machine-parseable.
 */

import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const USAGE = "Usage: node validate-run.mjs <run-directory>";

/** Dataset id -> the one fixed records filename, per output-contract.md section 2. */
const DATASET_FILENAMES = {
  a1: "a1-repositories.jsonl",
  a2: "a2-commits.jsonl",
  a3: "a3-pull-requests.jsonl",
  a4: "a4-review-events.jsonl",
  a5: "a5-review-comments.jsonl",
  a6: "a6-branches.jsonl",
  a7: "a7-tags-releases.jsonl",
  b1: "b1-pipeline-definitions.jsonl",
  b2: "b2-pipeline-runs.jsonl",
  b3: "b3-jobs-steps.jsonl",
  b4: "b4-deployments.jsonl",
  b5: "b5-reruns-approvals.jsonl",
  c1: "c1-projects-boards.jsonl",
  c2: "c2-issues.jsonl",
  c3: "c3-issue-changelog.jsonl",
  c4: "c4-sprints.jsonl",
  c5: "c5-issue-comments.jsonl",
  c6: "c6-backlog.jsonl",
  d1: "d1-services.jsonl",
  d2: "d2-incidents.jsonl",
  d3: "d3-incident-timeline.jsonl",
  d4: "d4-alerts.jsonl",
  d5: "d5-oncall-shifts.jsonl",
  d6: "d6-priorities.jsonl",
};

/** Matches "D1", "d1-D6" or "D1–D6" style mentions in a gaps.md line. */
const DATASET_MENTION_PATTERN = /\b([a-dA-D])([1-9])(?:\s*[-–]\s*([a-dA-D])?([1-9]))?/g;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv) {
  const parsed = parseArgv(argv);
  if (parsed.error) {
    process.stderr.write(`${USAGE}\n${parsed.error}\n`);
    return 2;
  }

  let findings;
  try {
    findings = await validateRun(parsed.runDir);
  } catch (error) {
    process.stderr.write(`Could not validate run directory "${parsed.runDir}": ${error.message}\n`);
    return 2;
  }

  process.stdout.write(formatFindings(findings));
  return findings.some((finding) => finding.severity === "error") ? 1 : 0;
}

function parseArgv(argv) {
  if (argv.length !== 1) {
    return { error: `Expected exactly one argument (the run directory), got ${argv.length}.` };
  }
  const [runDir] = argv;
  if (runDir.startsWith("-")) {
    return { error: `Unrecognized flag "${runDir}" — this tool takes one positional run-directory argument and no flags.` };
  }
  return { runDir };
}

// ---------------------------------------------------------------------------
// Loading — schemas and the run directory's file listing
// ---------------------------------------------------------------------------

function resolveSchemasDir() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  return pluginRoot ? join(pluginRoot, "schemas") : resolve(__dirname, "..", "..", "schemas");
}

function compileSchemaValidators() {
  const schemasDir = resolveSchemasDir();
  const datasetSchema = JSON.parse(readFileSync(join(schemasDir, "dataset-file-schema.json"), "utf-8"));
  const manifestSchema = JSON.parse(readFileSync(join(schemasDir, "run-manifest-schema.json"), "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return {
    dataset: ajv.compile(datasetSchema),
    manifest: ajv.compile(manifestSchema),
  };
}

function readTextIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

// ---------------------------------------------------------------------------
// validateRun — one pass over every sidecar and records file in the directory
// ---------------------------------------------------------------------------

export async function validateRun(runDir) {
  const validators = compileSchemaValidators();
  const entries = await readdir(runDir);
  const metaFiles = entries.filter((name) => name.endsWith(".meta.json")).sort();
  const jsonlFiles = new Set(entries.filter((name) => name.endsWith(".jsonl")));
  const gapsContent = readTextIfExists(join(runDir, "gaps.md"));

  const findings = [];
  const claimedJsonlFiles = new Set();
  const sidecarsById = new Map();

  for (const metaFile of metaFiles) {
    const jsonlFile = metaFile.replace(/\.meta\.json$/, ".jsonl");
    claimedJsonlFiles.add(jsonlFile);
    const sidecar = validateSidecar(join(runDir, metaFile), join(runDir, jsonlFile), validators.dataset, gapsContent);
    findings.push(...sidecar.findings);
    if (sidecar.meta) {
      sidecarsById.set(datasetIdFromFilename(metaFile), sidecar.meta);
    }
  }

  for (const jsonlFile of jsonlFiles) {
    if (!claimedJsonlFiles.has(jsonlFile)) {
      findings.push(errorFinding(datasetIdFromFilename(jsonlFile), `records file "${jsonlFile}" has no matching sidecar`));
    }
  }

  findings.push(...validateManifestIfPresent(runDir, validators.manifest, sidecarsById));

  return findings;
}

function validateSidecar(metaPath, jsonlPath, datasetValidator, gapsContent) {
  const metaFile = basename(metaPath);
  const datasetId = datasetIdFromFilename(metaFile);

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  } catch (error) {
    return { findings: [errorFinding(datasetId, `sidecar "${metaFile}" is not valid JSON: ${error.message}`)], meta: null };
  }

  const findings = validateAgainstSchema(datasetValidator, meta, datasetId, metaFile, "sdlc-analysis-dataset-v1");
  findings.push(...validateDatasetPair(jsonlPath, meta, metaFile));

  if (meta.completeness === "unavailable" && !gapsMentionsDataset(gapsContent, datasetId)) {
    findings.push(errorFinding(datasetId, `completeness is "unavailable" but gaps.md has no line naming ${datasetId}`));
  }

  return { findings, meta };
}

function validateManifestIfPresent(runDir, manifestValidator, sidecarsById) {
  const manifestPath = join(runDir, "_run-manifest.json");
  if (!existsSync(manifestPath)) {
    return [];
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (error) {
    return [errorFinding("_run-manifest", `"_run-manifest.json" is not valid JSON: ${error.message}`)];
  }

  const findings = validateAgainstSchema(manifestValidator, manifest, "_run-manifest", "_run-manifest.json", "sdlc-analysis-run-manifest-v1");
  findings.push(...crossCheckManifest(manifest, sidecarsById));
  return findings;
}

// ---------------------------------------------------------------------------
// crossCheckManifest — the manifest's per-dataset claims against the sidecars
//
// The manifest is what --resume reads, so a manifest that disagrees with the
// sidecars is worse than a missing one: it silently steers the next run. The
// contract (docs/output-contract.md section 7) defines every datasets[] value
// as copied verbatim from the sidecar — truncation_count as derived from its
// truncation array — so any disagreement is an error, invariant 7 of section 8.
// ---------------------------------------------------------------------------

export function crossCheckManifest(manifest, sidecarsById) {
  if (!Array.isArray(manifest.datasets)) {
    return [];
  }

  const findings = [];
  const listedIds = new Set();

  for (const entry of manifest.datasets) {
    if (typeof entry?.dataset !== "string") {
      continue; // shape defects are the manifest schema's findings, not ours
    }
    listedIds.add(entry.dataset);

    const meta = sidecarsById.get(entry.dataset);
    if (!meta) {
      findings.push(errorFinding(entry.dataset, `_run-manifest.json lists dataset "${entry.dataset}" but the run directory has no parseable sidecar for it`));
      continue;
    }

    for (const field of ["completeness", "record_count", "records_file"]) {
      if (entry[field] !== meta[field]) {
        findings.push(
          errorFinding(
            entry.dataset,
            `_run-manifest.json ${field} (${JSON.stringify(entry[field])}) does not match the sidecar's (${JSON.stringify(meta[field])}) — manifest values are copied verbatim from the sidecar`
          )
        );
      }
    }

    const truncationLength = Array.isArray(meta.truncation) ? meta.truncation.length : 0;
    if (entry.truncation_count !== truncationLength) {
      findings.push(
        errorFinding(entry.dataset, `_run-manifest.json truncation_count (${entry.truncation_count}) does not match the sidecar's truncation.length (${truncationLength})`)
      );
    }
  }

  for (const datasetId of sidecarsById.keys()) {
    if (!listedIds.has(datasetId)) {
      findings.push(errorFinding(datasetId, `sidecar for "${datasetId}" is on disk but _run-manifest.json datasets[] does not list it`));
    }
  }

  return findings;
}

function validateAgainstSchema(validate, data, datasetId, fileLabel, schemaId) {
  if (validate(data)) {
    return [];
  }
  return (validate.errors ?? []).map((error) =>
    errorFinding(datasetId, `"${fileLabel}" fails schema ${schemaId} at "${error.instancePath || "/"}": ${error.message}`)
  );
}

// ---------------------------------------------------------------------------
// validateDatasetPair — an already-parsed sidecar against its records file
//
// Takes the parsed sidecar rather than its path: validateSidecar has read and
// parsed the file already, and parsing it a second time here would duplicate
// both the read and the "not valid JSON" branch. `metaFile` is the sidecar's
// basename, carried through for the findings that name it.
// ---------------------------------------------------------------------------

export function validateDatasetPair(jsonlPath, meta, metaFile) {
  const datasetId = datasetIdFromFilename(metaFile);
  const jsonlFile = basename(jsonlPath);

  let lineInfo;
  try {
    lineInfo = readJsonlLineInfo(jsonlPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [errorFinding(datasetId, `records file "${jsonlFile}" is missing for sidecar "${metaFile}"`)];
    }
    throw error;
  }

  const findings = lineInfo.malformedLines.map(({ lineNumber, message }) =>
    errorFinding(datasetId, `records file "${jsonlFile}" line ${lineNumber} is not valid JSON: ${message}`)
  );
  findings.push(...checkInvariants(meta, lineInfo.lineCount));
  return findings;
}

function readJsonlLineInfo(jsonlPath) {
  const raw = readFileSync(jsonlPath, "utf-8");
  const lines = raw === "" ? [] : raw.split("\n").filter((line, index, all) => !(index === all.length - 1 && line === ""));

  const malformedLines = [];
  lines.forEach((line, index) => {
    try {
      JSON.parse(line);
    } catch (error) {
      malformedLines.push({ lineNumber: index + 1, message: error.message });
    }
  });

  return { lineCount: lines.length, malformedLines };
}

// ---------------------------------------------------------------------------
// checkInvariants — the cross-file checks a JSON schema cannot express
// ---------------------------------------------------------------------------

export function checkInvariants(meta, recordCount) {
  const datasetId = typeof meta.dataset === "string" ? meta.dataset : "unknown";
  const findings = [];

  if (meta.record_count !== recordCount) {
    findings.push(
      errorFinding(
        datasetId,
        `sidecar record_count (${meta.record_count}) does not match the actual line count of ${meta.records_file ?? "the records file"} (${recordCount})`
      )
    );
  }

  if (meta.completeness === "unavailable" && recordCount !== 0) {
    findings.push(errorFinding(datasetId, `completeness is "unavailable" but the records file has ${recordCount} line(s) — it must be empty`));
  }

  const expectedFilename = DATASET_FILENAMES[datasetId];
  if (expectedFilename && meta.records_file !== expectedFilename) {
    findings.push(
      errorFinding(datasetId, `records_file "${meta.records_file}" does not match the fixed filename "${expectedFilename}" for dataset "${datasetId}"`)
    );
  }

  return findings;
}

function gapsMentionsDataset(gapsContent, datasetId) {
  if (!gapsContent) {
    return false;
  }
  const idMatch = datasetId.match(/^([a-d])([1-9])$/i);
  if (!idMatch) {
    return false;
  }
  const [, targetLetter, targetNumberText] = idMatch;
  const targetNumber = Number(targetNumberText);

  for (const match of gapsContent.matchAll(DATASET_MENTION_PATTERN)) {
    const [, letter, startText, , endText] = match;
    if (letter.toLowerCase() !== targetLetter.toLowerCase()) {
      continue;
    }
    const start = Number(startText);
    const end = endText ? Number(endText) : start;
    if (targetNumber >= start && targetNumber <= end) {
      return true;
    }
  }
  return false;
}

function datasetIdFromFilename(filename) {
  const match = filename.match(/^([a-d][1-9])-/);
  return match ? match[1] : filename;
}

function errorFinding(dataset, message) {
  return { severity: "error", dataset, message };
}

// ---------------------------------------------------------------------------
// formatFindings — rendering only; it never decides the exit code
// ---------------------------------------------------------------------------

export function formatFindings(findings) {
  if (findings.length === 0) {
    return "No findings. Every dataset in this run satisfies the output contract.\n";
  }

  const lines = findings.map((finding) => `[${finding.severity.toUpperCase()}] ${finding.dataset}: ${finding.message}`);
  const errorCount = findings.filter((finding) => finding.severity === "error").length;
  lines.push("", `${findings.length} finding(s), ${errorCount} error(s).`);
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMainModule) {
  const exitCode = await main(process.argv.slice(2));
  process.exitCode = exitCode;
}
