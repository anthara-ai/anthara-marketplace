import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DRAW = join(here, 'draw-shape.mjs')
const CHECK_PAGE = join(here, 'check-page.mjs')
const CHECK_LINKS = join(here, '..', '..', 'plan', 'references', 'check-links.mjs')

const run = (script, ...args) => spawnSync('node', [script, ...args], { encoding: 'utf8' })
const scratch = () => mkdtempSync(join(tmpdir(), 'refactoring-plugin-'))

function cloneWithLegacyRouters() {
  const repo = scratch()
  const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' }).trim()
  git('init', '-q')
  mkdirSync(join(repo, 'src', 'routers'), { recursive: true })
  for (const file of ['src/routers/legacy-router.ts', 'src/routers/billing-router.ts', 'src/app.module.ts']) writeFileSync(join(repo, file), 'export {}\n')
  git('add', '.')
  git('commit', '-q', '-m', 'init')
  git('remote', 'add', 'origin', 'https://github.com/acme/shop.git')
  return { repo, hash: git('rev-parse', 'HEAD') }
}

const specWithPaths = {
  id: 'shape-today',
  title: 'Today: the app module wires two routers.',
  nodes: [
    { id: 'app', label: 'AppModule', col: 0, row: 0, path: 'src/app.module.ts' },
    { id: 'routers', label: '2 legacy routers', col: 1, row: 0, kind: 'group', files: ['src/routers/legacy-router.ts', 'src/routers/billing-router.ts'] },
    { id: 'folder', label: 'routers folder', col: 1, row: 1, path: 'src/routers' },
  ],
  edges: [{ from: 'app', to: 'routers' }, { from: 'app', to: 'folder' }],
}

function draw(spec, ...flags) {
  const dir = scratch()
  writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec))
  return run(DRAW, join(dir, 'spec.json'), ...flags)
}

const pageAround = (panel, audience) => {
  const dir = scratch()
  const page = join(dir, `shop-plan.for-${audience}.html`)
  writeFileSync(page, `<main><section class="slide" aria-label="The shape"><div class="shape shape--single"><div class="shape-panel">\n${panel}\n</div></div></section></main>`)
  return page
}

test('a box with a path is drawn as a link the link tool can fill', () => {
  const { stdout, status } = draw(specWithPaths)
  assert.equal(status, 0)
  assert.match(stdout, /<a class="box-link" data-path="src\/app.module.ts"><title>src\/app.module.ts<\/title><rect class="box" data-node="app" data-path="src\/app.module.ts"/)
})

test('a group box carries every file it stands for', () => {
  const { stdout } = draw(specWithPaths)
  assert.match(stdout, /data-node="routers" data-files="src\/routers\/legacy-router.ts,src\/routers\/billing-router.ts"/)
})

test('the legend names the path behind every box and every file behind a group', () => {
  const { stdout } = draw(specWithPaths, '--legend')
  assert.match(stdout, /<ol class="shape-legend"/)
  assert.match(stdout, /<span class="mono">2 legacy routers<\/span> <a class="src-link" data-path="src\/routers\/legacy-router.ts">src\/routers\/legacy-router.ts<\/a>, <a class="src-link" data-path="src\/routers\/billing-router.ts">/)
  assert.match(stdout, /<span class="mono">routers folder<\/span> <a class="src-link" data-path="src\/routers">/)
})

test('a legend is refused while any box has no path', () => {
  const spec = { ...specWithPaths, nodes: [...specWithPaths.nodes, { id: 'mystery', label: 'something', col: 2, row: 0 }], edges: [] }
  const { status, stderr } = draw(spec, '--legend')
  assert.equal(status, 1)
  assert.match(stderr, /--legend needs a path on every box, and "mystery" has none/)
})

test('a group box whose count disagrees with its files is refused', () => {
  const spec = { ...specWithPaths, nodes: specWithPaths.nodes.map(n => n.id === 'routers' ? { ...n, count: 3 } : n) }
  const { status, stderr } = draw(spec)
  assert.equal(status, 1)
  assert.match(stderr, /says count 3 but lists 2 files/)
})

test('a file the plan creates is listed in the legend as new, without a link', () => {
  const spec = { ...specWithPaths, nodes: [...specWithPaths.nodes, { id: 'reg', label: 'RouterRegistry', col: 2, row: 0, kind: 'after', path: 'src/routers/router.registry.ts' }], edges: [] }
  const { stdout } = draw(spec, '--legend')
  assert.match(stdout, /<span class="mono">RouterRegistry<\/span> <span class="mono">src\/routers\/router.registry.ts<\/span> <span class="shape-legend-note">new<\/span>/)
  assert.doesNotMatch(stdout, /<a class="box-link" data-path="src\/routers\/router.registry.ts"/)
})

test('after --fix every box and legend entry opens its file or folder at the commit', () => {
  const { repo, hash } = cloneWithLegacyRouters()
  const page = pageAround(draw(specWithPaths, '--legend').stdout, 'team')
  const first = run(CHECK_LINKS, page, '--repo', repo, '--hash', hash)
  assert.match(first.stdout, /unlinked box: src\/app.module.ts, src\/routers, src\/routers\/legacy-router.ts, src\/routers\/billing-router.ts/)
  assert.match(first.stdout, /unlinked box: src\/app.module.ts, src\/routers/)
  run(CHECK_LINKS, page, '--repo', repo, '--hash', hash, '--fix')
  const html = readFileSync(page, 'utf8')
  assert.match(html, new RegExp(`<a class="box-link" data-path="src/app.module.ts" href="https://github.com/acme/shop/blob/${hash}/src/app.module.ts">`))
  assert.match(html, new RegExp(`data-path="src/routers" href="https://github.com/acme/shop/tree/${hash}/src/routers"`))
  const second = run(CHECK_LINKS, page, '--repo', repo, '--hash', hash)
  assert.equal(second.status, 0, second.stdout)
})

test('a box whose path is not in the repository at the commit is reported', () => {
  const { repo, hash } = cloneWithLegacyRouters()
  const spec = { ...specWithPaths, nodes: specWithPaths.nodes.map(n => n.id === 'app' ? { ...n, path: 'src/gone.module.ts' } : n) }
  const page = pageAround(draw(spec).stdout, 'team')
  const { stdout, status } = run(CHECK_LINKS, page, '--repo', repo, '--hash', hash, '--fix')
  assert.equal(status, 1)
  assert.match(stdout, /path missing: box for src\/gone.module.ts/)
})

test('a file named without its extension is reported when the page links it nowhere', () => {
  const { repo, hash } = cloneWithLegacyRouters()
  const page = pageAround('<p class="lede">The legacy-router carries every route.</p>', 'team')
  const { stdout, status } = run(CHECK_LINKS, page, '--repo', repo, '--hash', hash)
  assert.equal(status, 1)
  assert.match(stdout, /file named without its extension: legacy-router\n\s+write it as legacy-router.ts/)
})

test('a file named without its extension passes once the page links that file', () => {
  const { repo, hash } = cloneWithLegacyRouters()
  const page = pageAround('<p class="lede">The legacy-router carries every route, see src/routers/legacy-router.ts.</p>', 'team')
  run(CHECK_LINKS, page, '--repo', repo, '--hash', hash, '--fix')
  const { status, stdout } = run(CHECK_LINKS, page, '--repo', repo, '--hash', hash)
  assert.equal(status, 0, stdout)
})

test('a group box links to the deepest folder holding its files and lists them on hover', () => {
  const { stdout } = draw(specWithPaths)
  assert.match(stdout, /<a class="box-link" data-path="src\/routers"><title>src\/routers\/legacy-router.ts\nsrc\/routers\/billing-router.ts<\/title><rect class="box box--group" data-node="routers"/)
})

test('a team page whose box names no path is refused, a leadership slide is not', () => {
  const spec = { ...specWithPaths, nodes: [...specWithPaths.nodes, { id: 'mystery', label: 'something', col: 2, row: 0 }] }
  const linked = draw(spec).stdout.replace(/<a class="box-link"([^>]*)>/g, '<a class="box-link"$1 href="#x">')
  const team = run(CHECK_PAGE, pageAround(linked, 'team')).stdout
  const leadership = run(CHECK_PAGE, pageAround(linked, 'leadership')).stdout
  assert.match(team, /the box "mystery" in "The shape" names no path/)
  assert.doesNotMatch(leadership, /diagram specificity/)
})

test('a team page without a legend passes when every box is a link', () => {
  const linked = draw(specWithPaths).stdout.replace(/<a class="box-link"([^>]*)>/g, '<a class="box-link"$1 href="#x">')
  const { stdout } = run(CHECK_PAGE, pageAround(linked, 'team'))
  assert.doesNotMatch(stdout, /diagram specificity|diagram links/)
})

test('a group box that names no files is refused for every audience', () => {
  const spec = { ...specWithPaths, nodes: specWithPaths.nodes.map(n => n.id === 'routers' ? { id: n.id, label: n.label, col: n.col, row: n.row, kind: 'group', count: 2 } : n) }
  const page = pageAround(draw(spec).stdout, 'leadership')
  const { stdout } = run(CHECK_PAGE, page)
  assert.match(stdout, /the group box "routers" names no files/)
})

test('a box link the link tool has not filled is refused', () => {
  const page = pageAround(draw(specWithPaths, '--legend').stdout, 'team')
  const { stdout } = run(CHECK_PAGE, page)
  assert.match(stdout, /a box or legend link for src\/app.module.ts has no href/)
})

test('a legend that misses a drawn file is refused', () => {
  const linked = draw(specWithPaths, '--legend').stdout.replace(/<a class="(box-link|src-link)"([^>]*)>/g, '<a class="$1"$2 href="#x">')
  const page = pageAround(linked.replace(/, <a class="src-link"[^>]*data-path="src\/routers\/billing-router.ts"[^>]*>[^<]*<\/a>/, ''), 'tech-lead')
  const { stdout } = run(CHECK_PAGE, page)
  assert.match(stdout, /src\/routers\/billing-router.ts is drawn in "The shape" but missing from its legend/)
})

test('a panel drawn a second time with a suffix declares no id the first copy has', () => {
  const first = draw(specWithPaths).stdout
  const second = draw(specWithPaths, '--suffix', '-ax').stdout
  const idsOf = svg => [...svg.matchAll(/ id="([^"]+)"/g)].map(m => m[1])
  assert.ok(idsOf(first).length > 0)
  assert.deepEqual(idsOf(first).filter(id => idsOf(second).includes(id)), [])
  assert.match(second, /aria-labelledby="shape-today-ax-title"/)
})

test('a list of line numbers after a path counts as separate numbers in the number gate', () => {
  const dir = scratch()
  const plan = join(dir, 'plan.md')
  const read = join(dir, 'read.txt')
  writeFileSync(plan, 'The pair is pinned at `activate.service.spec.ts:669,693`.\n')
  writeFileSync(read, 'Pinned at activate.service.spec.ts:693 and again at line 669.\n')
  const { status, stdout } = run(join(here, 'check-numbers.mjs'), read, plan)
  assert.equal(status, 0, stdout)
})
