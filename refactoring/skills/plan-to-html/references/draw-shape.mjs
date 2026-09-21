#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const COL_W = 190, COL_GAP = 40, COL_PITCH = COL_W + COL_GAP
const ROW_H = 42, ROW_GAP = 26, ROW_PITCH = ROW_H + ROW_GAP
const PORT_SPACING = 10
const ARROW = 10
const LANE_INSET = 6, LANE_CLEARANCE = 4
const ROW_GUTTER_PADDING = 4
const LABEL_X = 12, LABEL_Y = 26, LABEL_RIGHT_MARGIN = 4
const MONO_CHAR = 13 * 0.62
const MAX_NODES = 8, MAX_EDGES = 8, MAX_FAN = 3
const BACK_LANE_GAP = 14, BACK_INSET = 30, BACK_STAGGER = 12
const SAME_COLUMN_INSET = 32, SAME_COLUMN_INSET_STEP = 14, SAME_COLUMN_LANE_STEP = 8, SAME_COLUMN_TURN_ABOVE_BOX = 13

const args = process.argv.slice(2)
const wantLegend = args.includes('--legend')
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const idSuffix = option('--suffix') ?? ''
const specPath = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--suffix') ?? ''
const spec = JSON.parse(await readFile(specPath, 'utf8').catch(() => {
  console.error('usage: node draw-shape.mjs <spec.json> [--legend] [--suffix <id suffix>]; the spec format is in shape-spec.md beside this script')
  process.exit(2)
}))

const nodes = new Map(spec.nodes.map(node => [node.id, { ...node, x: node.col * COL_PITCH, y: node.row * ROW_PITCH }]))
const byCell = new Map(spec.nodes.map(node => [`${node.col},${node.row}`, node.id]))
const fail = message => { console.error(`draw-shape: ${message}`); process.exit(1) }

const BUDGET_HINT = 'collapse what the claim does not need into one "group" box, drop the edges it does not rest on, and let the title carry the rest'
if (spec.nodes.length > MAX_NODES) fail(`${spec.nodes.length} boxes, budget ${MAX_NODES}; ${BUDGET_HINT}`)
if (spec.edges.length > MAX_EDGES) fail(`${spec.edges.length} edges, budget ${MAX_EDGES}; ${BUDGET_HINT}`)
const fanOf = (end, id) => spec.edges.filter(edge => edge[end] === id).length
for (const node of spec.nodes) {
  if (fanOf('from', node.id) > MAX_FAN) fail(`"${node.id}" has ${fanOf('from', node.id)} edges out, budget ${MAX_FAN}; ${BUDGET_HINT}`)
  if (fanOf('to', node.id) > MAX_FAN) fail(`"${node.id}" has ${fanOf('to', node.id)} edges in, budget ${MAX_FAN}; ${BUDGET_HINT}`)
}

const labelFitsItsBox = label => LABEL_X + label.length * MONO_CHAR <= COL_W - LABEL_RIGHT_MARGIN
const twinOf = node => spec.nodes.find(other => other !== node && other.col === node.col && other.row === node.row)
for (const node of spec.nodes) {
  if (!labelFitsItsBox(node.label)) fail(`label "${node.label}" is too long for a box; shorten it`)
  const twin = twinOf(node)
  if (twin) fail(`"${node.id}" and "${twin.id}" share cell (${node.col},${node.row})`)
  checkWhatTheBoxStandsFor(node)
}

function checkWhatTheBoxStandsFor(node) {
  const isGroup = node.kind === 'group'
  if (node.files && !isGroup && node.kind !== 'after') fail(`"${node.id}" lists files but is neither a group box nor a new-files box; give a single box a "path"`)
  if (node.files && !Array.isArray(node.files)) fail(`"${node.id}" has "files" that is not a list of paths`)
  if (node.files && node.count !== undefined && node.count !== node.files.length) fail(`"${node.id}" says count ${node.count} but lists ${node.files.length} files; drop the count or fix the list`)
  if (node.path && (isGroup || node.files)) fail(`"${node.id}" is a group box with a "path"; list its "files" instead`)
  if (wantLegend && !node.path && !node.files) fail(`--legend needs a path on every box, and "${node.id}" has none; add "path" (or "files" on a group box), or render without the legend`)
}

const isBack = edge => edge.kind === 'back'
const panelHasAfter = spec.nodes.some(node => node.kind === 'after') || spec.edges.some(edge => edge.kind === 'after')
for (const edge of spec.edges) {
  const caller = nodes.get(edge.from), callee = nodes.get(edge.to)
  if (!caller || !callee) fail(`edge ${edge.from} -> ${edge.to} names a node the spec does not have`)
  if (caller === callee) fail(`edge ${edge.from} -> ${edge.to} loops`)
  if (isBack(edge) && panelHasAfter) fail(`edge ${edge.from} -> ${edge.to} is a back edge in an after panel; a cycle after the plan is a defect for a step to remove, not a shape to draw`)
  if (isBack(edge) && callee.col >= caller.col) fail(`edge ${edge.from} -> ${edge.to} is declared back but does not point backwards; drop the kind`)
  if (!isBack(edge) && callee.col < caller.col) fail(`edge ${edge.from} -> ${edge.to} points backwards; move "${edge.to}" to the right of "${edge.from}", or declare kind "back" if it is a cycle that exists today`)
}
const forwardEdges = spec.edges.filter(edge => !isBack(edge))
const backEdges = spec.edges.filter(isBack)

const portOffsets = count => Array.from({ length: count }, (_, k) => (k - (count - 1) / 2) * PORT_SPACING)

function assignPorts(direction) {
  const thisEnd = direction === 'out' ? 'from' : 'to'
  const farEnd = direction === 'out' ? 'to' : 'from'
  for (const node of nodes.values()) {
    const edges = forwardEdges
      .filter(edge => edge[thisEnd] === node.id && nodes.get(edge[farEnd]).col !== node.col)
      .sort((p, q) => nodes.get(p[farEnd]).row - nodes.get(q[farEnd]).row || nodes.get(p[farEnd]).col - nodes.get(q[farEnd]).col)
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
  for (const edge of forwardEdges) {
    const caller = nodes.get(edge.from), callee = nodes.get(edge.to)
    if (caller.col === callee.col) continue
    claim(caller.col, edge, 'exit')
    if (callee.col > caller.col + 1) claim(callee.col - 1, edge, 'enter')
  }
  for (const [gutter, uses] of gutters) spreadAcrossGutter(gutter, uses)
}

function spreadAcrossGutter(gutter, uses) {
  uses.sort((p, q) => (p.edge.outY ?? 0) - (q.edge.outY ?? 0))
  const usable = COL_GAP - LANE_INSET - ARROW - LANE_CLEARANCE
  const step = uses.length > 1 ? usable / (uses.length - 1) : 0
  uses.forEach((use, k) => {
    const x = gutterLeft(gutter) + LANE_INSET + (uses.length > 1 ? k * step : usable / 2)
    use.edge[use.role === 'exit' ? 'exitLaneX' : 'enterLaneX'] = Math.round(x * 10) / 10
  })
}
assignLanes()

const rowGutterY = (row, k, count) => {
  const top = row * ROW_PITCH + ROW_H
  const usable = ROW_GAP - 2 * ROW_GUTTER_PADDING
  const step = count > 1 ? usable / (count - 1) : 0
  return top + ROW_GUTTER_PADDING + (count > 1 ? k * step : usable / 2)
}

const columnsBetween = (caller, callee) => Array.from({ length: callee.col - caller.col - 1 }, (_, i) => caller.col + 1 + i)
const canRunStraightInto = (caller, callee) => columnsBetween(caller, callee).every(col => cellFree(col, callee.row))

function assignRowLanes() {
  const lanes = new Map()
  for (const edge of forwardEdges) {
    const caller = nodes.get(edge.from), callee = nodes.get(edge.to)
    if (callee.col <= caller.col + 1) continue
    if (canRunStraightInto(caller, callee)) { edge.straight = true; continue }
    edge.gutterRow = Math.min(caller.row, callee.row)
    if (!lanes.has(edge.gutterRow)) lanes.set(edge.gutterRow, [])
    lanes.get(edge.gutterRow).push(edge)
  }
  for (const [row, edges] of lanes) edges.forEach((edge, k) => { edge.laneY = rowGutterY(row, k, edges.length) })
}
assignRowLanes()

const sameColumnEdgesRouted = new Map()

function routeWithinColumn(edge, caller, callee) {
  const alreadyRouted = sameColumnEdgesRouted.get(caller.col) ?? 0
  sameColumnEdgesRouted.set(caller.col, alreadyRouted + 1)
  const inset = SAME_COLUMN_INSET + alreadyRouted * SAME_COLUMN_INSET_STEP
  if (callee.row === caller.row + 1) return `M${caller.x + inset} ${caller.y + ROW_H}V${callee.y}`
  if (callee.row < caller.row) fail(`edge ${edge.from} -> ${edge.to} points upwards in one column; put the caller in the upper row`)
  const lane = gutterLeft(caller.col) + LANE_INSET + alreadyRouted * SAME_COLUMN_LANE_STEP
  return `M${caller.x + COL_W} ${caller.y + ROW_H / 2}H${lane}V${callee.y - SAME_COLUMN_TURN_ABOVE_BOX}H${callee.x + COL_W - inset}V${callee.y}`
}

function route(edge) {
  const caller = nodes.get(edge.from), callee = nodes.get(edge.to)
  if (caller.col === callee.col) return routeWithinColumn(edge, caller, callee)
  const exitX = caller.x + COL_W, enterX = callee.x
  const exitY = edge.outY, enterY = edge.inY
  if (callee.col === caller.col + 1 || edge.straight) {
    if (Math.abs(exitY - enterY) <= PORT_SPACING) return `M${exitX} ${enterY}H${enterX}`
    return `M${exitX} ${exitY}H${edge.exitLaneX}V${enterY}H${enterX}`
  }
  return `M${exitX} ${exitY}H${edge.exitLaneX}V${edge.laneY}H${edge.enterLaneX}V${enterY}H${enterX}`
}

const cols = Math.max(...spec.nodes.map(node => node.col)) + 1
const rows = Math.max(...spec.nodes.map(node => node.row)) + 1
const width = cols * COL_PITCH - COL_GAP
const gridBottom = rows * ROW_PITCH - ROW_GAP
const height = gridBottom + LANE_CLEARANCE + backEdges.length * BACK_LANE_GAP

const rowsBelow = node => Array.from({ length: rows - node.row - 1 }, (_, i) => node.row + 1 + i)
const cellsBelowAreFree = node => rowsBelow(node).every(row => cellFree(node.col, row))

function routeBack(edge, laneIndex) {
  const caller = nodes.get(edge.from), callee = nodes.get(edge.to)
  for (const node of [caller, callee]) {
    if (!cellsBelowAreFree(node)) fail(`back edge ${edge.from} -> ${edge.to} would run through a box under "${node.id}"; put "${node.id}" in the bottom row of its column`)
  }
  const laneY = gridBottom + (laneIndex + 1) * BACK_LANE_GAP
  const exitX = caller.x + COL_W - BACK_INSET - laneIndex * BACK_STAGGER
  const enterX = callee.x + BACK_INSET + laneIndex * BACK_STAGGER
  return `M${exitX} ${caller.y + ROW_H}V${laneY}H${enterX}V${callee.y + ROW_H}`
}

const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const standsFor = node => node.files ? ` data-files="${esc(node.files.join(','))}"` : node.path ? ` data-path="${esc(node.path)}"` : ''
const deepestCommonFolder = files => {
  const folders = files.map(file => file.split('/').slice(0, -1))
  const shared = folders[0].filter((segment, depth) => folders.every(folder => folder[depth] === segment))
  return shared.join('/')
}
const linkTarget = node => node.files ? deepestCommonFolder(node.files) : node.path
const hoverText = node => node.files ? node.files.join('\n') : node.path
const boxClass = node => ['box', node.kind === 'after' && 'box--after', node.kind === 'gone' && 'box--gone', node.kind === 'group' && 'box--group'].filter(Boolean).join(' ')
const EDGE_KINDS = new Set(['after', 'future', 'back', 'indirect'])
const edgeKind = edge => EDGE_KINDS.has(edge.kind) ? edge.kind : 'today'
const arrowClass = kind => kind === 'today' || kind === 'indirect' ? 'arrow' : `arrow arrow--${kind === 'future' ? 'after' : kind}`
const kinds = new Set(spec.edges.map(edgeKind))
const panelId = `${spec.id}${idSuffix}`
const markerId = kind => `${panelId}-arrow-${kind}`

const arrowheadMarker = kind =>
  `<marker id="${markerId(kind)}" markerUnits="userSpaceOnUse" markerWidth="${ARROW}" markerHeight="${ARROW}" refX="${ARROW}" refY="${ARROW / 2}" orient="auto"><path d="M0 0L${ARROW} ${ARROW / 2}L0 ${ARROW}z" class="${arrowClass(kind)}"/></marker>`
const boxMarkup = node => `<rect class="${boxClass(node)}" data-node="${node.id}"${standsFor(node)} x="${node.x}" y="${node.y}" width="${COL_W}" height="${ROW_H}"/><text x="${node.x + LABEL_X}" y="${node.y + LABEL_Y}">${esc(node.label)}</text>`
const opensAFileThatExists = node => (node.path || node.files) && node.kind !== 'after'
const linkedBox = node => opensAFileThatExists(node)
  ? `<a class="box-link" data-path="${esc(linkTarget(node))}"><title>${esc(hoverText(node))}</title>${boxMarkup(node)}</a>`
  : node.path ? `<g><title>${esc(node.path)} (new)</title>${boxMarkup(node)}</g>` : boxMarkup(node)
const edgeMarkup = edge => {
  const kind = edgeKind(edge)
  const d = isBack(edge) ? routeBack(edge, backEdges.indexOf(edge)) : route(edge)
  return `<path class="edge${kind === 'today' ? '' : ` edge--${kind}`}" data-from="${edge.from}" data-to="${edge.to}" d="${d}" marker-end="url(#${markerId(kind)})"/>`
}

const out = [
  `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${panelId}-title">`,
  `  <title id="${panelId}-title">${esc(spec.title)}</title>`,
  `  <defs>${[...kinds].map(arrowheadMarker).join('')}</defs>`,
  ...[...nodes.values()].map(node => `  ${linkedBox(node)}`),
  ...spec.edges.map(edge => `  ${edgeMarkup(edge)}`),
  '</svg>',
]
if (wantLegend) out.push(legendMarkup())
console.log(out.join('\n'))

function legendMarkup() {
  const items = spec.nodes.map(node => `  <li><span class="mono">${esc(node.label)}</span> ${legendPaths(node)}</li>`)
  return ['<ol class="shape-legend" aria-label="What each box stands for">', ...items, '</ol>'].join('\n')
}

function legendPaths(node) {
  if (node.kind === 'after') return `<span class="mono">${esc(node.path)}</span> <span class="shape-legend-note">new</span>`
  const paths = node.files ?? [node.path]
  return paths.map(path => `<a class="src-link" data-path="${esc(path)}">${esc(path)}</a>`).join(', ')
}
