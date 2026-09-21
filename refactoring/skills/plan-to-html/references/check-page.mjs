#!/usr/bin/env node
// Checks a filled refactoring pitch page. Node 18+, no dependencies.
//
//   node check-page.mjs docs/refactoring/<module-slug>-plan.for-<audience>.html
//
// Everything here is computable from the markup alone, which is why it can be
// a script rather than a judgement call. It covers three kinds of defect that
// are invisible when reading the markup: leftovers from the scaffold, prose
// that breaks the writing rules (headings that join two claims, one-word
// column headers, semicolons, parentheses carrying a second sentence), and
// the diagram's geometry (boxes that collide, labels that overrun, edges that
// run through a box they do not connect, edges naming a box that is not
// drawn).
//
// The diagram's specificity is checked here too: a group box carries the
// files it stands for, a box wrapped in a link has its href, on a page for
// the team or the tech lead every box names a path, and a legend, when one
// is drawn, covers every box, since "legacy routers" tells a developer
// nothing until the box opens the routers.
//
// Repository links are checked by the plan skill's check-links.mjs against a
// local clone, and the diagram's accuracy against the code is checked by the
// dependency-graph-verifier agent. Checks needing a rendered page (slide
// height, wrapped text, contrast) are listed at the end as a reminder.

import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const safeRead = path => { try { return readFileSync(path, 'utf8') } catch { return null } }
const headingSlug = text => text.replace(/`/g, '').trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')

const TEXT_CHECKS = [
  { name: 'unfilled slot', re: /\{\{/g, hint: 'a finished page contains no {{ }} slot' },
  { name: 'catalogue slide left in', re: /data-catalogue/g, hint: 'delete every section carrying data-catalogue' },
  { name: 'em dash', re: /—/g, hint: 'use a colon, a comma, parentheses, or a new sentence' },
  { name: 'fill-guidance comment left in', re: /HOW TO USE IT/g, hint: 'replace it with the page\'s own provenance' },
  { name: 'external resource', re: /(?:src|href)="https?:\/\/(?!dev\.azure\.com|github\.com|gitlab\.com|bitbucket\.org)|@import/g, hint: 'the page must load nothing; repository links are fine' },
  // Only inline styles: that is where a filler writes type sizes. The
  // stylesheet's own `.shape svg` sizes are inside an SVG viewBox and scale
  // with the diagram, so they must NOT go through --ts.
  { name: 'stray closing anchor', re: /<\/a>\s*<\/a>/g, hint: 'an </a> with no opening tag; the browser drops it, but the markup is wrong and a later tool may not' },
  { name: 'bold lead-in glued to the next word', re: /<\/strong>[A-Za-z]/g, hint: 'put a space after </strong>, or the two sentences render as one word' },
  { name: 'bare font-size in an inline style', re: /style="[^"]*font-size:\s*\d+px/g, hint: 'use calc(<n>px * var(--ts, 1)), and follow the same rule for any CSS you add' },
]

const HEADING_WORDS = 16
const HEADER_WORDS = 6
const PARENTHESIS_WORDS = 4
const ONE_WORD_HEADERS = new Set(['#', 'file', 'step', 'phase', 'risk', 'measure', 'bug', 'folder', 'today', 'commit', 'commits', 'lines', 'where', 'why', 'what', 'test', 'function'])
const COPY_BUDGET = { lede: 40, body: 32, footnote: 40, kicker: 14, 'path-label': 8, 'pair-label': 6, 'tile-sub': 14, 'step-field': 36, 'ax-lede': 50 }
const BOX_CLEARANCE = 6
const EDGE_CLEARANCE = 4
const MONO_CHAR_WIDTH = 0.62
const DEFAULT_LABEL_SIZE = 13
const SAMPLES_PER_SEGMENT = 24

const findings = []
const report = (where, message, hint) => findings.push({ where, message, hint })

function checkText(html) {
  for (const { name, re, hint } of TEXT_CHECKS) {
    const hits = html.match(re)
    if (hits) report('page', `${hits.length} \u00d7 ${name}`, hint)
  }
}

const stripTags = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const wordCount = s => s.split(' ').filter(Boolean).length

function checkHeadings(html) {
  for (const [, tag, inner] of html.matchAll(/<(h1|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = stripTags(inner)
    const words = wordCount(text)
    if (words > HEADING_WORDS) report('headings', `"${text.slice(0, 70)}" runs to ${words} words`, 'a heading is one short claim; the rest belongs in the lede')
    if (/,\s+(and|but|so|which|because|while|then)\b|;/.test(text)) report('headings', `"${text.slice(0, 70)}" joins two claims`, 'say one thing in the heading and the second in the lede')
  }
}

function checkColumnHeaders(html) {
  for (const m of html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>|<div class="th[^"]*">([\s\S]*?)<\/div>/g)) {
    const text = stripTags(m[1] ?? m[2])
    const words = wordCount(text)
    if (/\?$/.test(text)) report('tables', `column header "${text}" is a question`, 'name what the column holds, such as "Touched by the plan"')
    if (words === 1 && !ONE_WORD_HEADERS.has(text.toLowerCase())) report('tables', `column header "${text}" is one word`, 'a reader outside the team cannot expand it; say what the column holds and its unit')
    if (words > HEADER_WORDS) report('tables', `column header "${text}" runs to ${words} words`, 'shorten it and put the definition in the caveat row')
  }
}

function proseOf(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(style|script|svg|head)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<(code|span class="mono")(?:\s[^>]*)?>[\s\S]*?<\/(code|span)>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

const ID_CELL = /<td\b[^>]*class="[^"]*\bid\b[^"]*"[^>]*>([\s\S]*?)<\/td>/g
const stackValues = inner => inner.split(/<[a-z]+\b[^>]*class="[^"]*\bax-stack\b[^"]*"[^>]*>/)
const textOf = fragment => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const markupOf = html => html.replace(/<!--[\s\S]*?-->/g, ' ')

function checkIdCells(html) {
  for (const [, inner] of markupOf(html).matchAll(ID_CELL)) {
    for (const value of stackValues(inner).map(textOf).filter(Boolean)) {
      if (!/\s/.test(value)) continue
      report('appendix', `prose in a monospace id cell: "${value.slice(0, 60)}"`,
        'td.id holds one identifier or one path per .ax-stack line; words, counts and pairs joined by "and" go in a text or num cell')
    }
  }
}

function checkBold(html) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(style|script|svg)\b[\s\S]*?<\/\1>/g, '')
  for (const [, inner] of markup.matchAll(/<strong\b[^>]*>([\s\S]*?)<\/strong>/g)) {
    const text = stripTags(inner)
    if (wordCount(text) > 6) report('prose', `bold runs to ${wordCount(text)} words: "${text.slice(0, 60)}"`, 'bold the two-to-five-word handle, then write the sentence in plain weight')
  }
}

function checkProse(html) {
  const prose = proseOf(html)
  for (const m of prose.matchAll(/;/g)) {
    report('prose', `semicolon near "…${prose.slice(Math.max(0, m.index - 40), m.index + 20).trim()}…"`, 'write two sentences')
  }
  for (const [, inner] of prose.matchAll(/\(([^()]+)\)/g)) {
    if (wordCount(inner) >= PARENTHESIS_WORDS) report('prose', `a parenthesis carries "${inner.slice(0, 60)}"`, 'promote it to a sentence of its own')
  }
}

function checkCopyLength(html) {
  const slides = html.slice(0, html.indexOf('<section class="appendix"') > 0 ? html.indexOf('<section class="appendix"') : html.length)
  const appendix = html.slice(slides.length)
  const scan = (region, classes, where) => {
    for (const cls of classes) {
      const re = new RegExp(`<(p|div|span) class="${cls}[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, 'g')
      for (const [, , inner] of region.matchAll(re)) {
        const text = stripTags(inner)
        const words = wordCount(text)
        if (words > COPY_BUDGET[cls]) report(where, `.${cls} runs to ${words} words: "${text.slice(0, 60)}"`, `budget is ${COPY_BUDGET[cls]}; cut, move it to the appendix, or drop the claim, never shrink type`)
      }
    }
    for (const [, inner] of region.matchAll(/<div class="step-field[^"]*">[\s\S]*?<p>([\s\S]*?)<\/p>/g)) {
      const words = wordCount(stripTags(inner))
      if (words > COPY_BUDGET['step-field']) report(where, `a step field runs to ${words} words: "${stripTags(inner).slice(0, 60)}"`, `budget is ${COPY_BUDGET['step-field']}; the full text lives in the appendix disclosure`)
    }
  }
  scan(slides, ['lede', 'body', 'footnote', 'kicker', 'path-label', 'pair-label', 'tile-sub'], 'slide copy')
  scan(appendix, ['ax-lede'], 'appendix copy')
}

function checkAnchors(html) {
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]))
  const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1])
  for (const target of new Set(targets)) {
    if (!ids.has(target)) report('page', `anchor #${target} resolves to nothing`, 'every internal link needs an id on the page')
  }
  for (const target of new Set([...html.matchAll(/href="([^"#:]+\.md)#([^"]+)"/g)].map(m => `${m[1]}#${m[2]}`))) {
    const [file, slug] = target.split('#')
    const markdown = safeRead(join(dirname(pagePath), file))
    if (markdown === null) { report('page', `link to ${file} points to no file beside the page`, 'the markdown plan sits beside the page, so link it by its basename'); continue }
    const slugs = new Set([...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => headingSlug(m[1])))
    if (!slugs.has(slug)) report('page', `#${slug} is not a heading in ${file}`, `use the heading's slug: lowercase, punctuation dropped, spaces to hyphens (${[...slugs].slice(0, 4).join(', ')}, …)`)
  }
  const sheets = [...html.matchAll(/class="ax-sheet"\s+id="([^"]+)"/g)].map(m => m[1])
  const pills = new Set([...html.matchAll(/class="pill-link"\s+href="#([^"]+)"/g)].map(m => m[1]))
  for (const sheet of sheets) {
    if (!pills.has(sheet)) report('appendix', `sheet #${sheet} has no pill link on the divider slide`, 'every appendix sheet must be reachable from the divider')
  }
}

function checkChartNames(html) {
  const charts = [...html.matchAll(/class="(pair|col-chart|stack-bar|path)"([^>]*)>/g)]
  for (const [, kind, attrs] of charts) {
    if (!/role="img"/.test(attrs) || !/aria-label="/.test(attrs)) {
      report('charts', `a ${kind} chart has no accessible name`, 'add role="img" and an aria-label that states its numbers')
    }
  }
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`))
  return m ? m[1] : null
}

function parseSvgs(html) {
  return [...html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)].map(([, attrs, inner], index) => {
    const label = attr(attrs, 'aria-labelledby') || attr(attrs, 'aria-label') || `svg ${index + 1}`
    const [, , vw, vh] = (attr(attrs, 'viewBox') || '0 0 0 0').split(/\s+/).map(Number)
    const boxes = [...inner.matchAll(/<rect\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter(tag => /class="[^"]*\bbox\b/.test(tag))
      .map(tag => ({
        x: +attr(tag, 'x'), y: +attr(tag, 'y'),
        w: +attr(tag, 'width'), h: +attr(tag, 'height'),
      }))
    const labels = [...inner.matchAll(/<text\b[^>]*x="([\d.]+)"[^>]*y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)]
      .map(([, x, y, text]) => ({ x: +x, y: +y, text: text.trim() }))
    const nodeIds = new Set([...inner.matchAll(/<rect\b[^>]*>/g)].map(([tag]) => attr(tag, 'data-node')).filter(Boolean))
    const edgeTags = [...inner.matchAll(/<path\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter(tag => /class="[^"]*\bedge\b/.test(tag))
    const edges = edgeTags.map(tag => attr(tag, 'd'))
    const endpoints = edgeTags.map(tag => [attr(tag, 'data-from'), attr(tag, 'data-to')])
    return { label, vw, vh, boxes, labels, edges, nodeIds, endpoints }
  })
}

const overlaps = (a, b, gap) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap &&
  a.y < b.y + b.h + gap && b.y < a.y + a.h + gap

const contains = (box, p, pad) =>
  p.x > box.x - pad && p.x < box.x + box.w + pad &&
  p.y > box.y - pad && p.y < box.y + box.h + pad

function samplePath(d) {
  const tokens = d.match(/[MLHVC]|-?[\d.]+/g) || []
  const points = []
  let i = 0, x = 0, y = 0, command = 'M'
  const push = () => points.push({ x, y })
  const cubic = (x1, y1, x2, y2, ex, ey) => {
    const [sx, sy] = [x, y]
    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT, u = 1 - t
      points.push({
        x: u * u * u * sx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
        y: u * u * u * sy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
      })
    }
    x = ex; y = ey
  }
  const line = (ex, ey) => {
    const [sx, sy] = [x, y]
    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT
      points.push({ x: sx + (ex - sx) * t, y: sy + (ey - sy) * t })
    }
    x = ex; y = ey
  }
  const next = () => +tokens[i++]
  while (i < tokens.length) {
    if (/[MLHVC]/.test(tokens[i])) command = tokens[i++]
    if (command === 'M') { x = next(); y = next(); push() }
    else if (command === 'L') line(next(), next())
    else if (command === 'H') line(next(), y)
    else if (command === 'V') line(x, next())
    else if (command === 'C') cubic(next(), next(), next(), next(), next(), next())
    else i++
  }
  return points
}

function labelFontSize(html) {
  const m = html.match(/\.shape svg text\s*\{[^}]*font-size:\s*([\d.]+)px/)
  return m ? +m[1] : DEFAULT_LABEL_SIZE
}

const DIAGRAM_BUDGET = { boxes: 8, edges: 8 }

function checkDiagramBudget(svg, where) {
  const hint = 'a panel is a story, not an import graph: collapse what the claim does not need into one group box and drop the edges it does not rest on'
  if (svg.boxes.length > DIAGRAM_BUDGET.boxes) report(where, `${svg.boxes.length} boxes, budget ${DIAGRAM_BUDGET.boxes}`, hint)
  if (svg.edges.length > DIAGRAM_BUDGET.edges) report(where, `${svg.edges.length} edges, budget ${DIAGRAM_BUDGET.edges}`, hint)
}

function checkDiagram(svg, labelSize) {
  const where = `diagram "${svg.label}"`
  checkDiagramBudget(svg, where)

  svg.boxes.forEach((box, a) => {
    svg.boxes.slice(a + 1).forEach(other => {
      if (overlaps(box, other, BOX_CLEARANCE)) {
        report(where, `two boxes collide or sit closer than ${BOX_CLEARANCE}px at (${box.x},${box.y}) and (${other.x},${other.y})`,
          'give every node its own row and column in the layered grid')
      }
    })
    if (box.x < 0 || box.y < 0 || box.x + box.w > svg.vw || box.y + box.h > svg.vh) {
      report(where, `a box at (${box.x},${box.y}) falls outside the viewBox`, 'grow the viewBox or drop a node')
    }
  })

  for (const label of svg.labels) {
    const host = svg.boxes.find(b => contains(b, { x: label.x, y: label.y }, 0))
    if (!host) {
      report(where, `the label "${label.text}" sits in no box`, 'place every label inside the box it names')
      continue
    }
    const width = label.text.length * labelSize * MONO_CHAR_WIDTH
    if (label.x + width > host.x + host.w - 4) {
      report(where, `the label "${label.text}" overruns its box by ${Math.ceil(label.x + width - host.x - host.w + 4)}px`,
        'widen the box or shorten the name')
    }
  }

  svg.endpoints.forEach(([from, to]) => {
    for (const id of [from, to]) {
      if (id && !svg.nodeIds.has(id)) report(where, `an edge names "${id}", which no box carries as data-node`, 'draw the diagram with draw-shape.mjs from one spec, so every edge names a drawn box')
    }
  })

  svg.edges.forEach(d => {
    const points = samplePath(d)
    if (points.length < 2) return
    const [start, end] = [points[0], points[points.length - 1]]
    const endpointOf = p => svg.boxes.findIndex(b => contains(b, p, 12))
    const exempt = new Set([endpointOf(start), endpointOf(end)])
    const crossed = new Set()
    for (const p of points) {
      svg.boxes.forEach((box, index) => {
        if (!exempt.has(index) && contains(box, p, EDGE_CLEARANCE)) crossed.add(index)
      })
    }
    for (const index of crossed) {
      const box = svg.boxes[index]
      report(where, `an edge runs through the box at (${box.x},${box.y}) that is neither of its endpoints`,
        'route the edge around it, or move the box to a free row')
    }
  })
}

const AUDIENCES_THAT_READ_PATHS = new Set(['team', 'tech-lead'])
const audienceOf = path => path.match(/\.for-([a-z-]+)\.html$/)?.[1] ?? null

function checkBoxLinks(html) {
  for (const [tag] of markupOf(html).matchAll(/<a\b[^>]*\bdata-path="[^"]+"[^>]*>/g)) {
    if (!/\bhref="[^"]+"/.test(tag)) report('diagram links', `a box or legend link for ${attr(tag, 'data-path')} has no href`, 'run check-links.mjs --fix, which fills every <a data-path> from the clone')
  }
}

const sectionsOf = html => markupOf(html).split(/(?=<section\b)/).filter(s => /<rect\b[^>]*data-node=/.test(s))
const isAppendix = section => /class="appendix"/.test(section)
const rectsIn = section => [...section.matchAll(/<rect\b[^>]*data-node="[^"]*"[^>]*>/g)].map(([tag]) => tag)
const pathsBehind = rects => rects.flatMap(tag => (attr(tag, 'data-files') ?? attr(tag, 'data-path') ?? '').split(',').filter(Boolean))
const legendPathsIn = section => new Set([...section.matchAll(/<ol class="shape-legend"[\s\S]*?<\/ol>/g)].flatMap(([legend]) => [...legend.matchAll(/data-path="([^"]+)"|<span class="mono">([^<]+)<\/span> <span class="shape-legend-note">/g)].map(m => m[1] ?? m[2])))

function checkDiagramSpecificity(html, audience) {
  const where = 'diagram specificity'
  for (const section of sectionsOf(html)) {
    const rects = rectsIn(section)
    for (const tag of rects.filter(tag => /box--group/.test(tag) && !attr(tag, 'data-files'))) {
      report(where, `the group box "${attr(tag, 'data-node')}" names no files`, 'give it "files" in the shape spec, so the verifier and the legend know what it stands for')
    }
    const label = attr(section, 'aria-label') ?? 'a section'
    if (AUDIENCES_THAT_READ_PATHS.has(audience) || isAppendix(section)) checkEveryBoxNamesAPath(rects, label, where)
    checkLegendCovers(section, rects, label, where)
  }
}

function checkEveryBoxNamesAPath(rects, label, where) {
  for (const tag of rects.filter(tag => !attr(tag, 'data-path') && !attr(tag, 'data-files'))) {
    report(where, `the box "${attr(tag, 'data-node')}" in "${label}" names no path`, 'give it "path" in the shape spec, so the box opens the file; a developer reads the path, not the label')
  }
}

function checkLegendCovers(section, rects, label, where) {
  const legend = legendPathsIn(section)
  if (legend.size === 0) return
  for (const path of pathsBehind(rects).filter(path => !legend.has(path))) {
    report(where, `${path} is drawn in "${label}" but missing from its legend`, 'regenerate the legend from the same spec as the panel')
  }
}

const pagePath = process.argv[2] ?? ''
const html = await readFile(pagePath, 'utf8').catch(() => {
  console.error('usage: node check-page.mjs <page.html>')
  process.exit(2)
})

checkText(html)
checkHeadings(html)
checkColumnHeaders(html)
checkProse(html)
checkBold(html)
checkIdCells(html)
checkCopyLength(html)
checkAnchors(html)
checkChartNames(html)
checkBoxLinks(html)
checkDiagramSpecificity(html, audienceOf(pagePath))
const svgs = parseSvgs(html)
const labelSize = labelFontSize(html)
svgs.forEach(svg => checkDiagram(svg, labelSize))

const grouped = new Map()
for (const f of findings) {
  if (!grouped.has(f.where)) grouped.set(f.where, [])
  grouped.get(f.where).push(f)
}
for (const [where, items] of grouped) {
  console.log(`\n${where}`)
  const seen = new Set()
  for (const { message, hint } of items) {
    const key = message + hint
    if (seen.has(key)) continue
    seen.add(key)
    console.log(`  ${message}\n    ${hint}`)
  }
}

console.log(`\n${svgs.length} diagram(s), ${svgs.reduce((n, s) => n + s.boxes.length, 0)} boxes, ${svgs.reduce((n, s) => n + s.edges.length, 0)} edges checked.`)
console.log(findings.length ? `\n${findings.length} finding(s).` : '\nNo findings.')
console.log('\nStill needed: check-numbers.mjs against the plan, check-links.mjs against the clone, the dependency-graph-verifier agent for the diagram, and a rendered page for slide height, wrapped text, disclosures and contrast.')

process.exit(findings.length ? 1 : 0)
