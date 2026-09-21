#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const html = await readFile(process.argv[2] ?? '', 'utf8').catch(() => {
  console.error('usage: node page-text.mjs <page.html>')
  process.exit(2)
})

const decodeEntities = text => text
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;|&#183;/g, '·')

const diagramAsItsSpokenTitle = svg => {
  const title = svg.match(/<title[^>]*>([\s\S]*?)<\/title>/)
  if (title) return `\n[diagram] ${title[1].trim()}\n`
  return /class="brand-wordmark"/.test(svg) ? ' ' : '\n[diagram without a title]\n'
}

const COLUMN_CHART = /<div class="col-chart"[^>]*>([\s\S]*?)<\/div>\s*<div class="col-labels">((?:\s*<div>[\s\S]*?<\/div>)+)\s*<\/div>/g

const columnChartAsLabelValuePairs = (chart, columns, labels) => {
  const values = [...columns.matchAll(/class="col-value[^"]*"[^>]*>([^<]*)</g)].map(match => match[1].trim())
  const names = [...labels.matchAll(/<div>([\s\S]*?)<\/div>/g)].map(match => match[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').trim())
  return '\n[chart] ' + values.map((value, index) => `${names[index] ?? '?'}: ${value}`).join(' · ') + '\n'
}

const readingOrderTextOf = section => {
  const marked = section
    .replace(COLUMN_CHART, columnChartAsLabelValuePairs)
    .replace(/<div class="stat[^"]*"[^>]*>/g, '\n[big number] ')
    .replace(/<h[1-3]\b[^>]*>/g, '\n\n## ')
    .replace(/<div class="kicker[^"]*"[^>]*>/g, '\n[kicker] ')
    .replace(/<(?:h3|div) class="ax-claim"[^>]*>/g, '\n\n## ')
    .replace(/<tr\b[^>]*>/g, '\n| ')
    .replace(/<\/t[dh]>/g, ' | ')
    .replace(/<(span|a) class="chip[^"]*"[^>]*>([\s\S]*?)<\/\1>/g, ' [$2] ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<span class="(?:sub|td-sub|ax-card-src|stat-unit|count)"[^>]*>/g, ' · ')
    .replace(/<\/(span|a|strong|em|b|i)>/g, '</$1> ')
    .replace(/<(p|li|div|summary|dt|dd|footer|blockquote)\b[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(marked)
    .replace(/[ \t]+/g, ' ').replace(/ \|\s*\n/g, ' |\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const bodyWithPicturesSpoken = html.slice(html.indexOf('<main'))
  .replace(/<(style|script)\b[\s\S]*?<\/\1>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<svg\b[\s\S]*?<\/svg>/g, diagramAsItsSpokenTitle)

const labelOf = section => section.match(/aria-label="([^"]*)"/)?.[1]
const kindOf = section => /class="appendix"/.test(section) ? 'APPENDIX' : 'SLIDE'
const banner = section => `\n==================== ${kindOf(section)}: ${labelOf(section)} ====================\n`

const sections = bodyWithPicturesSpoken.split(/(?=<section\b)/).filter(labelOf)
console.log(sections.map(section => banner(section) + readingOrderTextOf(section)).join('\n'))
