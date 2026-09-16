import { readFileSync } from "node:fs";
import { join } from "node:path";

const runDir = process.argv[2];
const HOURS_PER_DAY = 24;

function readRecords(file) {
  const raw = readFileSync(join(runDir, file), "utf-8");
  return raw === "" ? [] : raw.trimEnd().split("\n").map((line) => JSON.parse(line));
}

function nearestRankPercentile(sortedValues, percentile) {
  const rank = Math.ceil((percentile / 100) * sortedValues.length);
  return sortedValues[Math.max(rank, 1) - 1];
}

function calendarDaysBetween(from, to) {
  return (new Date(to) - new Date(from)) / (HOURS_PER_DAY * 60 * 60 * 1000);
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
  }
  return value;
}

const pullRequests = readRecords("a3-pull-requests.jsonl");
const reviews = readRecords("a4-review-events.jsonl");
const commits = readRecords("a2-commits.jsonl");

const firstReviewByPr = new Map();
for (const review of reviews) {
  const current = firstReviewByPr.get(review.pull_request_id);
  if (!current || review.submitted_at < current) {
    firstReviewByPr.set(review.pull_request_id, review.submitted_at);
  }
}

const reviewed = pullRequests.filter((pr) => firstReviewByPr.has(pr.id));
const unreviewedCount = pullRequests.length - reviewed.length;
const waitDays = reviewed.map((pr) => calendarDaysBetween(pr.created_at, firstReviewByPr.get(pr.id))).sort((left, right) => left - right);

const sharePct = (unreviewedCount / pullRequests.length) * 100;
if (sharePct < 0 || sharePct > 100) {
  throw new Error("unreviewed share must lie within 0 and 100");
}

const metrics = {
  pull_requests: {
    total: pullRequests.length,
    unreviewed: { count: unreviewedCount, share_pct: sharePct },
    time_to_first_review_days: { p50: nearestRankPercentile(waitDays, 50), p85: nearestRankPercentile(waitDays, 85) },
  },
  commits: { total: commits.length },
  staleness_exclusions: [],
};

process.stdout.write(`${JSON.stringify(sortKeys(metrics), null, 2)}\n`);
