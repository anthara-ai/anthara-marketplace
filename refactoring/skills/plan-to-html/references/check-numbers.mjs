#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const [readPath, planPath] = process.argv.slice(2)
if (!readPath || !planPath) {
  console.error('usage: node check-numbers.mjs <read.txt from page-text.mjs> <plan.md>')
  process.exit(2)
}

const NUMBER = /(?<![A-Za-z0-9_.#-])\d[\d,]*(?:\.\d+)?%?(?![\w.]*[A-Za-z])/g
const LINE_NUMBER_LIST_AFTER_A_PATH = /(:\d+(?:-\d+)?),(?=\d)/g
const SLIDE_COUNTER = /^\[kicker\]\s*\d+ of \d+\b/
const SINGLE_DIGIT = /^\d$/

const withEachLineNumberOnItsOwn = text => text.replace(LINE_NUMBER_LIST_AFTER_A_PATH, '$1, ')
const withoutThousandsSeparators = token => token.replace(/,/g, '')
const withoutPercentSign = token => token.replace(/%$/, '')
const numbersIn = text => [...withEachLineNumberOnItsOwn(text).matchAll(NUMBER)].map(([token]) => withoutThousandsSeparators(token))

const planNumbers = new Set(numbersIn(await readFile(planPath, 'utf8')))
const pageLines = (await readFile(readPath, 'utf8')).split('\n')

const planCarries = token => planNumbers.has(token) || planNumbers.has(withoutPercentSign(token))
const needsNoSource = (line, token) => SLIDE_COUNTER.test(line) || SINGLE_DIGIT.test(token) || planCarries(token)

const missing = pageLines.flatMap((line, index) =>
  numbersIn(line)
    .filter(token => !needsNoSource(line, token))
    .map(token => ({ line: index + 1, token, text: line.trim().slice(0, 110) })))

for (const { line, token, text } of missing) console.log(`line ${line}: ${token} is not in the plan\n    ${text}`)
console.log(missing.length ? `\n${missing.length} number(s) the plan does not carry.` : 'Every number on the page is in the plan.')
process.exit(missing.length ? 1 : 0)
