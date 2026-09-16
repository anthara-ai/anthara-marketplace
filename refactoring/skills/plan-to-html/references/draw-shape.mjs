#!/usr/bin/env node
// Draws one panel of the shape-of-the-change diagram from a small JSON spec.
// Node 18+, no dependencies.
//
//   node draw-shape.mjs shape-today.json > shape-today.svg
//
// The spec:
//   {
//     "id": "shape-today",
//     "title": "One or two sentences read aloud by a screen reader.",
//     "nodes": [ { "id": "ctrl", "label": "IntegrationController", "col": 0, "row": 0 },
//                { "id": "reg",  "label": "ProviderRegistry", "col": 2, "row": 1, "kind": "after" } ],
//     "edges": [ { "from": "ctrl", "to": "act" },
//                { "from": "act", "to": "reg", "kind": "after" } ]
//   }
//   node.kind: omitted (exists today) | "after" (the plan creates it) |
//              "gone" (dashed: removed, or the next provider) | "group"
//              (one dotted box standing for several untouched collaborators;
//              give it a "count" and the label carries it)
//   edge.kind: omitted (exists today) | "after" (the plan adds it) |
//              "future" (dashed: made possible by the plan, added by no step) |
//              "back" (a dependency that points against the layering, a cycle
//              that exists today; drawn dashed in the caution colour under the
//              grid, and refused in a panel that has anything of kind "after",
//              because a cycle after the plan is a defect, not a shape) |
//              "indirect" (dotted: a dependency that is not an import, such as
//              an event both sides name, a queue, a shared table or a config key)
//
// Every coordinate is computed from the column and row. Edges run left to
// right, leave a box at its right edge and arrive at the next box's left edge,
// and are drawn as horizontal and vertical segments only. A box with several
// edges in or out gets one port per edge, spaced down its edge, so no two
// arrowheads land on the same point. Edges that cross a column travel along a
// row gutter, where there is never a box. An edge that would have to point
// backwards is refused, because callers belong to the left of what they call,
// unless it is declared kind "back": then it leaves the caller's bottom edge,
// runs along a lane under the grid and arrives at the callee's bottom edge,
// which needs the cells below both boxes to be free.
//
// A panel is a story, not an import graph. It refuses more than 8 boxes, more
// than 8 edges, or a box with more than 3 edges out or 3 edges in. Collapse the
// modules the claim does not need into one "group" box, drop the edges the
// slide's claim does not rest on, and let the title carry the full statement.

import { readFile } from 'node:fs/promises'

const COL_W = 190, COL_GAP = 40, COL_PITCH = COL_W + COL_GAP
const ROW_H = 42, ROW_GAP = 26, ROW_PITCH = ROW_H + ROW_GAP
const PORT_SPACING = 10
const ARROW = 10
const LANE_INSET = 6
const LABEL_X = 12, LABEL_Y = 26
const MONO_CHAR = 13 * 0.62
const MAX_NODES = 8, MAX_EDGES = 8, MAX_FAN = 3
const BACK_LANE_GAP = 14, BACK_INSET = 30

const spec = JSON.parse(await readFile(process.argv[2] ?? '', 'utf8').catch(() => {
  console.error('usage: node draw-shape.mjs <spec.json>')
  process.exit(2)
}))

const nodes = new Map(spec.nodes.map(n => [n.id, { ...n, x: n.col * COL_PITCH, y: n.row * ROW_PITCH }]))
const byCell = new Map(spec.nodes.map(n => [`${n.col},${n.row}`, n.id]))
const fail = message => { console.error(`draw-shape: ${message}`); process.exit(1) }

const BUDGET_HINT = 'collapse what the claim does not need into one "group" box, drop the edges it does not rest on, and let the title carry the rest'
if (spec.nodes.length > MAX_NODES) fail(`${spec.nodes.length} boxes, budget ${MAX_NODES}; ${BUDGET_HINT}`)
if (spec.edges.length > MAX_EDGES) fail(`${spec.edges.length} edges, budget ${MAX_EDGES}; ${BUDGET_HINT}`)
const fanOf = (key, id) => spec.edges.filter(e => e[key] === id).length
for (const n of spec.nodes) {
  if (fanOf('from', n.id) > MAX_FAN) fail(`"${n.id}" has ${fanOf('from', n.id)} edges out, budget ${MAX_FAN}; ${BUDGET_HINT}`)
  if (fanOf('to', n.id) > MAX_FAN) fail(`"${n.id}" has ${fanOf('to', n.id)} edges in, budget ${MAX_FAN}; ${BUDGET_HINT}`)
}

for (const n of spec.nodes) {
  if (LABEL_X + n.label.length * MONO_CHAR > COL_W - 4) fail(`label "${n.label}" is too long for a box; shorten it`)
  const twin = spec.nodes.find(m => m !== n && m.col === n.col && m.row === n.row)
  if (twin) fail(`"${n.id}" and "${twin.id}" share cell (${n.col},${n.row})`)
}
const isBack = e => e.kind === 'back'
const panelHasAfter = spec.nodes.some(n => n.kind === 'after') || spec.edges.some(e => e.kind === 'after')
for (const e of spec.edges) {
  const a = nodes.get(e.from), b = nodes.get(e.to)
  if (!a || !b) fail(`edge ${e.from} -> ${e.to} names a node the spec does not have`)
  if (a === b) fail(`edge ${e.from} -> ${e.to} loops`)
  if (isBack(e) && panelHasAfter) fail(`edge ${e.from} -> ${e.to} is a back edge in an after panel; a cycle after the plan is a defect for a step to remove, not a shape to draw`)
  if (isBack(e) && b.col >= a.col) fail(`edge ${e.from} -> ${e.to} is declared back but does not point backwards; drop the kind`)
  if (!isBack(e) && b.col < a.col) fail(`edge ${e.from} -> ${e.to} points backwards; move "${e.to}" to the right of "${e.from}", or declare kind "back" if it is a cycle that exists today`)
}
const forwardEdges = spec.edges.filter(e => !isBack(e))
const backEdges = spec.edges.filter(isBack)

const portOffsets = count => Array.from({ length: count }, (_, k) => (k - (count - 1) / 2) * PORT_SPACING)

function assignPorts(direction) {
  const key = direction === 'out' ? 'from' : 'to'
  const other = direction === 'out' ? 'to' : 'from'
  for (const node of nodes.values()) {
    const edges = forwardEdges
      .filter(e => e[key] === node.id && nodes.get(e[other]).col !== node.col)
      .sort((p, q) => nodes.get(p[other]).row - nodes.get(q[other]).row || nodes.get(p[other]).col - nodes.get(q[other]).col)
    portOffsets(edges.length).forEach((offset, k) => { edges[k][`${direction}Y`] = node.y + ROW_H / 2 + offset })
  }
}
assignPorts('out')
assignPorts('in')

const gutterLeft = col => col * COL_PITCH + COL_W
const cellFree = (col, row) => !byCell.has(`${col},${row}`)

function assignLanes() {
  const gutters = new Map()
  const claim = (gutter, edge, role) => {
    if (!gutters.has(gutter)) gutters.set(gutter, [])
    gutters.get(gutter).push({ edge, role })
  }
  for (const e of forwardEdges) {
    const a = nodes.get(e.from), b = nodes.get(e.to)
    if (a.col === b.col) continue
    claim(a.col, e, 'exit')
    if (b.col > a.col + 1) claim(b.col - 1, e, 'enter')
  }
  for (const [gutter, uses] of gutters) {
    uses.sort((p, q) => (p.edge.outY ?? 0) - (q.edge.outY ?? 0))
    const usable = COL_GAP - LANE_INSET - ARROW - 4
    const step = uses.length > 1 ? usable / (uses.length - 1) : 0
    uses.forEach((use, k) => {
      const x = gutterLeft(gutter) + LANE_INSET + (uses.length > 1 ? k * step : usable / 2)
      use.edge[use.role === 'exit' ? 'exitLaneX' : 'enterLaneX'] = Math.round(x * 10) / 10
    })
  }
}
assignLanes()

const rowGutterY = (row, k, n) => {
  const top = row * ROW_PITCH + ROW_H
  const step = n > 1 ? (ROW_GAP - 8) / (n - 1) : 0
  return top + 4 + (n > 1 ? k * step : (ROW_GAP - 8) / 2)
}

function assignRowLanes() {
  const lanes = new Map()
  for (const e of forwardEdges) {
    const a = nodes.get(e.from), b = nodes.get(e.to)
    if (b.col <= a.col + 1) continue
    const straightRow = b.row
    const clear = Array.from({ length: b.col - a.col - 1 }, (_, i) => a.col + 1 + i).every(c => cellFree(c, straightRow))
    if (clear) { e.straight = true; continue }
    e.gutterRow = Math.min(a.row, b.row)
    if (!lanes.has(e.gutterRow)) lanes.set(e.gutterRow, [])
    lanes.get(e.gutterRow).push(e)
  }
  for (const [row, edges] of lanes) edges.forEach((e, k) => { e.laneY = rowGutterY(row, k, edges.length) })
}
assignRowLanes()

const sameColumnInsets = new Map()

function route(e) {
  const a = nodes.get(e.from), b = nodes.get(e.to)
  if (a.col === b.col) {
    const used = sameColumnInsets.get(a.col) ?? 0
    sameColumnInsets.set(a.col, used + 1)
    const inset = 32 + used * 14
    if (b.row === a.row + 1) return `M${a.x + inset} ${a.y + ROW_H}V${b.y}`
    if (b.row < a.row) fail(`edge ${e.from} -> ${e.to} points upwards in one column; put the caller in the upper row`)
    const lane = gutterLeft(a.col) + LANE_INSET + used * 8
    return `M${a.x + COL_W} ${a.y + ROW_H / 2}H${lane}V${b.y - 13}H${b.x + COL_W - inset}V${b.y}`
  }
  const x1 = a.x + COL_W, x2 = b.x
  const y1 = e.outY, y2 = e.inY
  if (b.col === a.col + 1 || e.straight) {
    if (Math.abs(y1 - y2) <= PORT_SPACING) return `M${x1} ${y2}H${x2}`
    return `M${x1} ${y1}H${e.exitLaneX}V${y2}H${x2}`
  }
  return `M${x1} ${y1}H${e.exitLaneX}V${e.laneY}H${e.enterLaneX}V${y2}H${x2}`
}

const cols = Math.max(...spec.nodes.map(n => n.col)) + 1
const rows = Math.max(...spec.nodes.map(n => n.row)) + 1
const width = cols * COL_PITCH - COL_GAP
const gridBottom = rows * ROW_PITCH - ROW_GAP
const height = gridBottom + 4 + backEdges.length * BACK_LANE_GAP

const cellsBelowAreFree = node => Array.from({ length: rows - node.row - 1 }, (_, i) => node.row + 1 + i).every(r => cellFree(node.col, r))

function routeBack(e, k) {
  const a = nodes.get(e.from), b = nodes.get(e.to)
  for (const n of [a, b]) {
    if (!cellsBelowAreFree(n)) fail(`back edge ${e.from} -> ${e.to} would run through a box under "${n.id}"; put "${n.id}" in the bottom row of its column`)
  }
  const laneY = gridBottom + (k + 1) * BACK_LANE_GAP
  const exitX = a.x + COL_W - BACK_INSET - k * 12
  const enterX = b.x + BACK_INSET + k * 12
  return `M${exitX} ${a.y + ROW_H}V${laneY}H${enterX}V${b.y + ROW_H}`
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const boxClass = n => ['box', n.kind === 'after' && 'box--after', n.kind === 'gone' && 'box--gone', n.kind === 'group' && 'box--group'].filter(Boolean).join(' ')
const EDGE_KINDS = new Set(['after', 'future', 'back', 'indirect'])
const edgeKind = e => EDGE_KINDS.has(e.kind) ? e.kind : 'today'
const arrowClass = kind => kind === 'today' || kind === 'indirect' ? 'arrow' : `arrow arrow--${kind === 'future' ? 'after' : kind}`
const kinds = new Set(spec.edges.map(edgeKind))
const markerId = kind => `${spec.id}-arrow-${kind}`

const out = []
out.push(`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${spec.id}-title">`)
out.push(`  <title id="${spec.id}-title">${esc(spec.title)}</title>`)
out.push(`  <defs>${[...kinds].map(kind =>
  `<marker id="${markerId(kind)}" markerUnits="userSpaceOnUse" markerWidth="${ARROW}" markerHeight="${ARROW}" refX="${ARROW}" refY="${ARROW / 2}" orient="auto"><path d="M0 0L${ARROW} ${ARROW / 2}L0 ${ARROW}z" class="${arrowClass(kind)}"/></marker>`).join('')}</defs>`)
for (const n of nodes.values()) {
  out.push(`  <rect class="${boxClass(n)}" data-node="${n.id}" x="${n.x}" y="${n.y}" width="${COL_W}" height="${ROW_H}"/><text x="${n.x + LABEL_X}" y="${n.y + LABEL_Y}">${esc(n.label)}</text>`)
}
const pathOf = (e, k) => isBack(e) ? routeBack(e, k) : route(e)
spec.edges.forEach((e, k) => {
  const kind = edgeKind(e)
  const backIndex = backEdges.indexOf(e)
  out.push(`  <path class="edge${kind === 'today' ? '' : ` edge--${kind}`}" data-from="${e.from}" data-to="${e.to}" d="${pathOf(e, backIndex)}" marker-end="url(#${markerId(kind)})"/>`)
})
out.push('</svg>')
console.log(out.join('\n'))
