#!/usr/bin/env node
// Every number on the page must appear in the markdown plan, because the plan
// is the page's only source. A number the plan does not carry is a number the
// author computed or invented while writing slides, and cold readers found
// those more often than anything else.
//
//   node page-text.mjs page.html > read.txt
//   node check-numbers.mjs read.txt docs/refactoring/<module>-plan.md
//
// A list of line numbers after a path, such as `spec.ts:669,693`, is read as
// two numbers and not as 669,693, so a page may cite either line on its own.
//
// Exits 1 with one line per missing number and the page line it sits on.

import { readFile } from 'node:fs/promises'

const [readPath, planPath] = process.argv.slice(2)
if (!readPath || !planPath) {
  console.error('usage: node check-numbers.mjs <read.txt from page-text.mjs> <plan.md>')
  process.exit(2)
}

const NUMBER = /(?<![A-Za-z0-9_.#-])\d[\d,]*(?:\.\d+)?%?(?![\w.]*[A-Za-z])/g
const normalise = token => token.replace(/,/g, '')
const LINE_LIST = /(:\d+(?:-\d+)?),(?=\d)/g
const separateLineLists = text => text.replace(LINE_LIST, '$1, ')
const SLIDE_COUNTER = /^\[kicker\]\s*\d+ of \d+\b/
const SINGLE_DIGIT = /^\d$/

const planNumbers = new Set([...separateLineLists(await readFile(planPath, 'utf8')).matchAll(NUMBER)].map(([token]) => normalise(token)))
const pageLines = separateLineLists(await readFile(readPath, 'utf8')).split('\n')

const numbersOn = line => [...line.matchAll(NUMBER)].map(([token]) => normalise(token))
const isCounted = (line, token) => SLIDE_COUNTER.test(line) || SINGLE_DIGIT.test(token)

const missing = []
pageLines.forEach((line, index) => {
  for (const token of numbersOn(line)) {
    if (isCounted(line, token) || planNumbers.has(token) || planNumbers.has(token.replace(/%$/, ''))) continue
    missing.push({ line: index + 1, token, text: line.trim().slice(0, 110) })
  }
})

for (const m of missing) console.log(`line ${m.line}: ${m.token} is not in the plan\n    ${m.text}`)
console.log(missing.length ? `\n${missing.length} number(s) the plan does not carry.` : 'Every number on the page is in the plan.')
process.exit(missing.length ? 1 : 0)
