#!/usr/bin/env node
// Prints a rendered pitch page as the text a reader meets, in reading order:
// slide by slide, then the appendix, with headings, kickers, table rows and
// chips kept apart. Node 18+, no dependencies.
//
//   node page-text.mjs docs/refactoring/<module-slug>-plan.for-<audience>.html > read.txt
//
// The cold-reader agent reads this file rather than the HTML, so that markup
// never counts as a stop and a diagram is named rather than dumped. Inline
// SVGs are replaced by their <title>, because that is what a screen reader
// says and what a reader who cannot see the picture has to go on.

import { readFile } from 'node:fs/promises'

const html = await readFile(process.argv[2] ?? '', 'utf8').catch(() => {
  console.error('usage: node page-text.mjs <page.html>')
  process.exit(2)
})

const decode = s => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;|&#183;/g, '·')

let body = html.slice(html.indexOf('<main'))
body = body.replace(/<(style|script)\b[\s\S]*?<\/\1>/g, '')
body = body.replace(/<!--[\s\S]*?-->/g, '')
body = body.replace(/<svg\b[\s\S]*?<\/svg>/g, svg => {
  const title = svg.match(/<title[^>]*>([\s\S]*?)<\/title>/)
  if (title) return `\n[diagram] ${title[1].trim()}\n`
  return /class="brand-wordmark"/.test(svg) ? ' ' : '\n[diagram without a title]\n'
})

const sections = body.split(/(?=<section\b)/)
const out = []
for (const section of sections) {
  const label = section.match(/aria-label="([^"]*)"/)?.[1]
  if (!label) continue
  const kind = /class="appendix"/.test(section) ? 'APPENDIX' : 'SLIDE'
  let t = section
  t = t.replace(/<div class="col-chart"[^>]*>([\s\S]*?)<\/div>\s*<div class="col-labels">((?:\s*<div>[\s\S]*?<\/div>)+)\s*<\/div>/g, (m, cols, labels) => {
    const values = [...cols.matchAll(/class="col-value[^"]*"[^>]*>([^<]*)</g)].map(x => x[1].trim())
    const names = [...labels.matchAll(/<div>([\s\S]*?)<\/div>/g)].map(x => x[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').trim())
    return '\n[chart] ' + values.map((v, i) => `${names[i] ?? '?'}: ${v}`).join(' · ') + '\n'
  })
  t = t.replace(/<div class="stat[^"]*"[^>]*>/g, '\n[big number] ')
  t = t.replace(/<h[1-3]\b[^>]*>/g, '\n\n## ')
  t = t.replace(/<div class="kicker[^"]*"[^>]*>/g, '\n[kicker] ')
  t = t.replace(/<(?:h3|div) class="ax-claim"[^>]*>/g, '\n\n## ')
  t = t.replace(/<tr\b[^>]*>/g, '\n| ')
  t = t.replace(/<\/t[dh]>/g, ' | ')
  t = t.replace(/<(span|a) class="chip[^"]*"[^>]*>([\s\S]*?)<\/\1>/g, ' [$2] ')
  t = t.replace(/<br\s*\/?>/g, ' ')
  t = t.replace(/<span class="(?:sub|td-sub|ax-card-src|stat-unit|count)"[^>]*>/g, ' · ')
  t = t.replace(/<\/(span|a|strong|em|b|i)>/g, '</$1> ')
  t = t.replace(/<(p|li|div|summary|dt|dd|footer|blockquote)\b[^>]*>/g, '\n')
  t = t.replace(/<[^>]+>/g, '')
  t = decode(t)
  t = t.replace(/[ \t]+/g, ' ').replace(/ \|\s*\n/g, ' |\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  out.push(`\n==================== ${kind}: ${label} ====================\n${t}`)
}
console.log(out.join('\n'))
