#!/usr/bin/env node
/**
 * Mechanically verifies a filled diagnostic deck against its evidence ledger,
 * its metrics, and the extraction run it was built from — the checks that
 * docs/report-contract.md section 6 assigns to a script rather than to the
 * report-verifier agent.
 *
 * The floor it holds: every number the deck shows is a ledger claim, every
 * claim resolves to a metric that `compute.mjs` reproduces from the records
 * on disk, every cited id exists in those records, and every truncated,
 * unavailable or excluded source is disclosed in the appendix. Numbers the
 * deck shows outside a claim are listed as warnings for the agent to judge.
 *
 * Usage: node verify-report.mjs <run-directory>
 * Findings go to stdout; diagnostics (usage errors, I/O failures) go to
 * stderr, so stdout stays machine-parseable. Exit 1 when any finding is an
 * error, 0 otherwise, 2 on usage errors.
 */

import Ajv2020 from "ajv/dist/2020.js";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const USAGE = "Usage: node verify-report.mjs <run-directory>";
const LEDGER_SCHEMA_ID = "sdlc-analysis-evidence-ledger-v1";
const REPORT_SUBDIR = "report";
const LEDGER_FILE = "evidence-ledger.json";
const EM_DASH = "—";
const COMPUTE_TIMEOUT_MS = 120_000;

const VOID_ELEMENTS = new Set(["br", "img", "hr", "input", "meta", "link", "source", "wbr", "col", "area", "base", "track", "embed", "param"]);
const NUMERIC_TOKEN_PATTERN = /(?<![\w#\-:/.])(\d[\d,]*(?:\.\d+)?)(?![\w\-:/]|\.\d)/g;
const DATASET_MENTION_PATTERN = /\b([a-dA-D])([1-9])(?:\s*[-–]\s*([a-dA-D])?([1-9]))?/g;
const IMPORT_SPECIFIER_PATTERNS = [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g, /^\s*import\s+['"]([^'"]+)['"]/gm];

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
    findings = verifyReport(parsed.runDir);
  } catch (error) {
    process.stderr.write(`Could not verify report under "${parsed.runDir}": ${error.message}\n`);
    return 2;
  }

  process.stdout.write(formatFindings(findings));
  return findings.some(isError) ? 1 : 0;
}

function parseArgv(argv) {
  if (argv.length !== 1) {
    return { error: argv.length === 0 ? "Missing <run-directory>." : "Exactly one argument is accepted." };
  }
  if (argv[0].startsWith("-")) {
    return { error: `Unrecognized option "${argv[0]}".` };
  }
  return { runDir: resolve(argv[0]) };
}

// ---------------------------------------------------------------------------
// verifyReport — the checks in the order report-contract.md section 6 fixes
// ---------------------------------------------------------------------------

export function verifyReport(runDir) {
  const reportDir = join(runDir, REPORT_SUBDIR);
  const loaded = loadLedger(reportDir);
  if (loaded.findings.length > 0) {
    return loaded.findings;
  }
  const ledger = loaded.ledger;

  const findings = checkFilesExist(reportDir, ledger);
  if (findings.length > 0) {
    return findings;
  }

  const sidecars = readSidecars(runDir);
  const deck = parseDeck(readFileSync(join(reportDir, ledger.deck_file), "utf-8"));
  const compute = checkComputeScript(reportDir, ledger, runDir);

  findings.push(...compute.findings);
  findings.push(...checkClaimsAgainstMetrics(ledger.claims, compute.metrics));
  findings.push(...checkRenderedFaithful(ledger.claims));
  findings.push(...checkDeckClaims(deck, ledger.claims));
  findings.push(...checkCompletenessAgreement(ledger, sidecars));
  findings.push(...checkReceipts(ledger.claims, runDir, sidecars));
  findings.push(...checkDeckHygiene(deck));
  findings.push(...checkDisclosures(ledger, deck));
  findings.push(...listUnclaimedNumbers(deck));
  return findings;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function loadLedger(reportDir) {
  const ledgerPath = join(reportDir, LEDGER_FILE);
  if (!existsSync(ledgerPath)) {
    return { findings: [errorFinding("ledger", `"${REPORT_SUBDIR}/${LEDGER_FILE}" is missing`)] };
  }

  let ledger;
  try {
    ledger = JSON.parse(readFileSync(ledgerPath, "utf-8"));
  } catch (error) {
    return { findings: [errorFinding("ledger", `"${LEDGER_FILE}" is not valid JSON: ${error.message}`)] };
  }

  const validate = compileLedgerValidator();
  if (validate(ledger)) {
    return { ledger, findings: [] };
  }
  const findings = (validate.errors ?? []).map((error) =>
    errorFinding("ledger", `"${LEDGER_FILE}" fails schema ${LEDGER_SCHEMA_ID} at "${error.instancePath || "/"}": ${error.message}`)
  );
  return { findings };
}

function compileLedgerValidator() {
  const schemaPath = resolve(__dirname, "..", "..", "schemas", "evidence-ledger-schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(JSON.parse(readFileSync(schemaPath, "utf-8")));
}

function checkFilesExist(reportDir, ledger) {
  const referenced = [ledger.deck_file, ledger.compute_script, ledger.metrics_file];
  return referenced.filter((file) => !existsSync(join(reportDir, file))).map((file) => errorFinding("files", `ledger names "${file}" but ${REPORT_SUBDIR}/${file} does not exist`));
}

function readSidecars(runDir) {
  const sidecars = new Map();
  for (const file of readdirSync(runDir).filter((name) => name.endsWith(".meta.json"))) {
    const meta = JSON.parse(readFileSync(join(runDir, file), "utf-8"));
    sidecars.set(meta.dataset, meta);
  }
  return sidecars;
}

// ---------------------------------------------------------------------------
// compute.mjs — imports and reproducibility
// ---------------------------------------------------------------------------

/**
 * The import check gates execution. This script runs a compute.mjs it found in
 * a run directory, and a run directory can arrive from anywhere (diagnose's
 * --from takes a path), so a script that reaches outside node: built-ins is
 * reported and never executed.
 */
function checkComputeScript(reportDir, ledger, runDir) {
  const importFindings = checkComputeImports(join(reportDir, ledger.compute_script));
  if (importFindings.length > 0) {
    return { metrics: readJsonOrNull(join(reportDir, ledger.metrics_file)) ?? {}, findings: importFindings };
  }
  return checkReproducible(reportDir, ledger, runDir);
}

export function checkComputeImports(scriptPath) {
  const source = readFileSync(scriptPath, "utf-8");
  const specifiers = IMPORT_SPECIFIER_PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
  return specifiers.filter((specifier) => !specifier.startsWith("node:")).map((specifier) => errorFinding("compute", `compute.mjs imports "${specifier}" — only node: built-ins are allowed`));
}

function checkReproducible(reportDir, ledger, runDir) {
  const scriptPath = join(reportDir, ledger.compute_script);
  const stored = readJsonOrNull(join(reportDir, ledger.metrics_file));
  if (stored === null) {
    return { metrics: {}, findings: [errorFinding("compute", `"${ledger.metrics_file}" is not valid JSON`)] };
  }

  const run = spawnSync(process.execPath, [scriptPath, runDir], { encoding: "utf-8", timeout: COMPUTE_TIMEOUT_MS, cwd: dirname(scriptPath) });
  if (run.status !== 0) {
    const reason = firstLine(run.stderr) || `exit status ${run.status}`;
    return { metrics: stored, findings: [errorFinding("compute", `compute.mjs failed to run: ${reason}`)] };
  }

  const fresh = parseJsonOrNull(run.stdout);
  if (fresh === null) {
    return { metrics: stored, findings: [errorFinding("compute", "compute.mjs did not print a single JSON document to stdout")] };
  }
  if (stableStringify(fresh) !== stableStringify(stored)) {
    return { metrics: stored, findings: [errorFinding("compute", `re-running compute.mjs does not reproduce "${ledger.metrics_file}" — the stored metrics are stale or the script is not deterministic`)] };
  }
  return { metrics: stored, findings: [] };
}

// ---------------------------------------------------------------------------
// Claims against metrics.json and against their own rendering
// ---------------------------------------------------------------------------

export function checkClaimsAgainstMetrics(claims, metrics) {
  const findings = [];
  for (const claim of claims) {
    const resolved = resolveMetricPath(metrics, claim.metric);
    if (!resolved.found) {
      findings.push(errorFinding(claim.id, `metric path "${claim.metric}" does not exist in metrics.json`));
    } else if (!valuesEqual(resolved.value, claim.value)) {
      findings.push(errorFinding(claim.id, `ledger value ${JSON.stringify(claim.value)} does not equal metrics.json "${claim.metric}" = ${JSON.stringify(resolved.value)}`));
    }
  }
  return findings;
}

function resolveMetricPath(metrics, path) {
  let current = metrics;
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      return { found: false };
    }
    current = current[segment];
  }
  return { found: true, value: current };
}

function valuesEqual(actual, expected) {
  if (typeof actual === "number" && typeof expected === "number") {
    return Math.abs(actual - expected) < 1e-9;
  }
  return actual === expected;
}

export function checkRenderedFaithful(claims) {
  return claims.filter((claim) => !isFaithfulRendering(claim)).map((claim) => errorFinding(claim.id, `rendered text "${claim.rendered}" is not a faithful rendering of value ${JSON.stringify(claim.value)}`));
}

export function isFaithfulRendering(claim) {
  if (typeof claim.value === "string") {
    return claim.rendered.includes(claim.value);
  }
  const token = firstNumericToken(claim.rendered);
  if (token === null) {
    return false;
  }
  const decimals = token.includes(".") ? token.split(".")[1].length : 0;
  const shown = Number(token.replace(/,/g, ""));
  return Math.abs(Number(claim.value.toFixed(decimals)) - shown) < 1e-9;
}

function firstNumericToken(text) {
  const match = [...text.matchAll(NUMERIC_TOKEN_PATTERN)][0];
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// The deck — parsed once into claimed text, unclaimed numbers, appendix text
// ---------------------------------------------------------------------------

export function parseDeck(html) {
  const stripped = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const deck = { text: "", appendixText: "", claimed: [], unclaimed: [] };
  const stack = [];

  for (const token of stripped.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (token.startsWith("<")) {
      applyTag(stack, token);
    } else {
      collectText(deck, stack, decodeEntities(token));
    }
  }
  return deck;
}

function applyTag(stack, tag) {
  const name = (tag.match(/^<\/?\s*([a-zA-Z][\w-]*)/) ?? [])[1]?.toLowerCase();
  if (!name) {
    return;
  }
  if (tag.startsWith("</")) {
    closeTag(stack, name);
    return;
  }
  if (VOID_ELEMENTS.has(name) || tag.endsWith("/>")) {
    return;
  }
  stack.push({ name, claim: attributeValue(tag, "data-claim"), appendix: isAppendixTag(tag) });
}

function closeTag(stack, name) {
  const index = stack.map((entry) => entry.name).lastIndexOf(name);
  if (index >= 0) {
    stack.length = index;
  }
}

function attributeValue(tag, attribute) {
  const match = tag.match(new RegExp(`\\s${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? (match[1] ?? match[2]) : null;
}

function isAppendixTag(tag) {
  const id = attributeValue(tag, "id");
  const classes = attributeValue(tag, "class") ?? "";
  return id === "appendix" || classes.split(/\s+/).includes("appendix");
}

function collectText(deck, stack, text) {
  deck.text += text;
  if (stack.some((entry) => entry.appendix)) {
    deck.appendixText += text;
  }
  const claim = [...stack].reverse().find((entry) => entry.claim !== null);
  if (claim) {
    appendClaimText(deck.claimed, claim, text);
  } else {
    deck.unclaimed.push(...numericTokensWithContext(text));
  }
}

function appendClaimText(claimed, claimEntry, text) {
  if (!claimEntry.record) {
    claimEntry.record = { id: claimEntry.claim, text: "" };
    claimed.push(claimEntry.record);
  }
  claimEntry.record.text += text;
}

function numericTokensWithContext(text) {
  return [...text.matchAll(NUMERIC_TOKEN_PATTERN)].map((match) => ({
    token: match[1],
    context: collapseWhitespace(text.slice(Math.max(0, match.index - 30), match.index + match[1].length + 30)),
  }));
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

// ---------------------------------------------------------------------------
// Deck ↔ ledger
// ---------------------------------------------------------------------------

export function checkDeckClaims(deck, claims) {
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  const findings = deck.claimed.flatMap((element) => checkClaimedElement(element, byId));
  const shown = new Set(deck.claimed.map((element) => element.id));
  for (const claim of claims) {
    if (!shown.has(claim.id)) {
      findings.push(warningFinding(claim.id, "ledger claim never appears in the deck as a data-claim element"));
    }
  }
  return findings;
}

function checkClaimedElement(element, byId) {
  const claim = byId.get(element.id);
  if (!claim) {
    return [errorFinding(element.id, `deck element carries data-claim="${element.id}" but the ledger has no such claim`)];
  }
  const shown = collapseWhitespace(element.text);
  if (shown !== collapseWhitespace(claim.rendered)) {
    return [errorFinding(element.id, `deck shows "${shown}" but the ledger's rendered text is "${claim.rendered}"`)];
  }
  return [];
}

export function checkDeckHygiene(deck) {
  const findings = [];
  const slots = deck.text.match(/\{\{/g)?.length ?? 0;
  if (slots > 0) {
    findings.push(errorFinding("deck", `${slots} unfilled "{{" slot(s) remain in the deck text`));
  }
  const dashes = deck.text.split(EM_DASH).length - 1;
  if (dashes > 0) {
    findings.push(errorFinding("deck", `${dashes} em dash(es) (U+2014) appear in the deck text`));
  }
  return findings;
}

export function listUnclaimedNumbers(deck) {
  return deck.unclaimed.map(({ token, context }) => warningFinding("unclaimed", `number "${token}" appears outside any data-claim element: "…${context}…"`));
}

// ---------------------------------------------------------------------------
// Ledger ↔ sidecars
// ---------------------------------------------------------------------------

export function checkCompletenessAgreement(ledger, sidecars) {
  const findings = ledger.claims.flatMap((claim) => checkClaimDatasets(claim, sidecars));
  const used = new Set(ledger.claims.flatMap((claim) => claim.datasets));
  const truncatedUsed = [...used].filter((id) => sidecars.get(id)?.completeness === "truncated").sort();
  const unavailable = [...sidecars.values()].filter((meta) => meta.completeness === "unavailable").map((meta) => meta.dataset).sort();

  if (!sameSet(ledger.datasets_used, [...used])) {
    findings.push(errorFinding("ledger", `datasets_used ${JSON.stringify(ledger.datasets_used)} does not equal the union of claim datasets ${JSON.stringify([...used].sort())}`));
  }
  if (!sameSet(ledger.lower_bound_datasets, truncatedUsed)) {
    findings.push(errorFinding("ledger", `lower_bound_datasets ${JSON.stringify(ledger.lower_bound_datasets)} does not equal the truncated datasets the claims use ${JSON.stringify(truncatedUsed)}`));
  }
  if (!sameSet(ledger.unavailable_datasets, unavailable)) {
    findings.push(errorFinding("ledger", `unavailable_datasets ${JSON.stringify(ledger.unavailable_datasets)} does not equal the unavailable sidecars on disk ${JSON.stringify(unavailable)}`));
  }
  return findings;
}

function checkClaimDatasets(claim, sidecars) {
  const findings = [];
  for (const id of claim.datasets) {
    const completeness = sidecars.get(id)?.completeness;
    if (completeness === undefined || completeness === "unavailable") {
      findings.push(errorFinding(claim.id, `claim uses dataset "${id}" which is ${completeness ?? "absent from the run"}`));
    }
  }
  const expectedLowerBound = claim.datasets.some((id) => sidecars.get(id)?.completeness === "truncated");
  if (claim.lower_bound !== expectedLowerBound) {
    findings.push(errorFinding(claim.id, `lower_bound is ${claim.lower_bound} but the claim's datasets are ${expectedLowerBound ? "" : "not "}truncated on disk`));
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Receipts — every cited id occurs in the records
// ---------------------------------------------------------------------------

export function checkReceipts(claims, runDir, sidecars) {
  const recordsCache = new Map();
  const readRecords = (id) => cachedRecords(recordsCache, runDir, sidecars.get(id)?.records_file);
  return claims.flatMap((claim) =>
    (claim.receipts ?? [])
      .filter((receipt) => !claim.datasets.some((id) => readRecords(id).includes(receipt)))
      .map((receipt) => errorFinding(claim.id, `receipt "${receipt}" does not occur in any of ${claim.datasets.join(", ")}`))
  );
}

function cachedRecords(cache, runDir, recordsFile) {
  if (!recordsFile) {
    return "";
  }
  if (!cache.has(recordsFile)) {
    const path = join(runDir, recordsFile);
    cache.set(recordsFile, existsSync(path) ? readFileSync(path, "utf-8") : "");
  }
  return cache.get(recordsFile);
}

// ---------------------------------------------------------------------------
// Disclosures — truncations, unavailability and exclusions named in the appendix
// ---------------------------------------------------------------------------

export function checkDisclosures(ledger, deck) {
  if (deck.appendixText === "") {
    return [warningFinding("appendix", "the deck has no appendix element (id or class \"appendix\"), so disclosures could not be checked")];
  }
  const findings = [];
  for (const id of [...ledger.lower_bound_datasets, ...ledger.unavailable_datasets]) {
    if (!textMentionsDataset(deck.appendixText, id)) {
      findings.push(errorFinding(id, `dataset is ${ledger.lower_bound_datasets.includes(id) ? "truncated" : "unavailable"} but the appendix never names it`));
    }
  }
  for (const exclusion of ledger.staleness_exclusions) {
    if (!deck.appendixText.includes(exclusion.disclosed_as)) {
      findings.push(errorFinding("exclusions", `staleness exclusion for domain ${exclusion.domain} is not disclosed in the appendix as "${exclusion.disclosed_as}"`));
    }
  }
  return findings;
}

export function textMentionsDataset(text, datasetId) {
  const [, letter, numberText] = datasetId.match(/^([a-d])([1-9])$/i) ?? [];
  if (!letter) {
    return false;
  }
  const target = Number(numberText);
  return [...text.matchAll(DATASET_MENTION_PATTERN)].some(([, mentionLetter, start, , end]) => {
    const inRange = target >= Number(start) && target <= Number(end ?? start);
    return mentionLetter.toLowerCase() === letter.toLowerCase() && inRange;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sameSet(left, right) {
  const sortedRight = [...right].sort();
  return left.length === right.length && [...left].sort().every((value, index) => value === sortedRight[index]);
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function firstLine(text) {
  return (text ?? "").split("\n").find((line) => line.trim() !== "") ?? "";
}

function readJsonOrNull(path) {
  return existsSync(path) ? parseJsonOrNull(readFileSync(path, "utf-8")) : null;
}

function parseJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function errorFinding(subject, message) {
  return { severity: "error", subject, message };
}

function warningFinding(subject, message) {
  return { severity: "warning", subject, message };
}

function isError(finding) {
  return finding.severity === "error";
}

// ---------------------------------------------------------------------------
// formatFindings — rendering only; it never decides the exit code
// ---------------------------------------------------------------------------

export function formatFindings(findings) {
  if (findings.length === 0) {
    return "No findings. Every number in the deck traces to a reproduced metric and every disclosure is present.\n";
  }
  const lines = findings.map((finding) => `[${finding.severity === "error" ? "ERROR" : "WARN"}] ${finding.subject}: ${finding.message}`);
  const errors = findings.filter(isError).length;
  lines.push("", `${findings.length} finding(s), ${errors} error(s), ${findings.length - errors} warning(s).`);
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMainModule) {
  process.exitCode = await main(process.argv.slice(2));
}
