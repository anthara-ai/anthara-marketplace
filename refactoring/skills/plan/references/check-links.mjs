#!/usr/bin/env node
// Checks, and with --fix writes, the repository links in a refactoring plan
// or in a pitch page rendered from one. Node 18+, no dependencies, needs a
// local clone that holds the plan's commit.
//
//   node check-links.mjs docs/refactoring/<slug>-plan.md --repo . --hash <commit>
//   node check-links.mjs docs/refactoring/<slug>-plan.for-team.html --repo . --hash <commit> --fix
//
// Every link is verified against the clone, never against the network: the
// path must exist at the commit, the commit must be the full 40-character
// hash (Azure DevOps refuses a short one), and the line range must lie inside
// the file. Every file the plan or page mentions that exists at the commit
// must be a link. A mention that does not resolve in the tree is left alone,
// because it is either a file the plan proposes to create or a file in
// another repository, and neither can be linked at this commit.
//
// --fix rewrites the file in place, wrapping every unlinked mention in a link
// to the repository host taken from the clone's origin remote. It touches
// nothing inside an existing link, an HTML tag or attribute, an SVG, a
// <title>, a script, a style, a comment, or a fenced code block.

import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const file = args.find(a => !a.startsWith('--'))
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const repo = option('--repo') ?? '.'
const fix = args.includes('--fix')
if (!file) { console.error('usage: node check-links.mjs <plan.md | page.html> --repo <clone> --hash <commit> [--fix]'); process.exit(2) }

const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

const hash = (() => {
  const given = option('--hash')
  try { return git('rev-parse', '--verify', `${given ?? 'HEAD'}^{commit}`) } catch { console.error(`check-links: commit ${given ?? 'HEAD'} is not in ${repo}`); process.exit(2) }
})()
if (!option('--hash')) console.error(`check-links: no --hash given, using HEAD of ${repo} (${hash.slice(0, 7)})`)

const remote = (() => { try { return git('remote', 'get-url', 'origin') } catch { return '' } })()

const HOSTS = [
  { name: 'GitHub', match: /github\.com[/:]([^/]+)\/([^/.]+)/, link: (m, p, a, b) => `https://github.com/${m[1]}/${m[2]}/blob/${hash}/${p}${a ? `#L${a}${b && b !== a ? `-L${b}` : ''}` : ''}` },
  { name: 'GitLab', match: /gitlab\.com[/:](.+?)\/([^/.]+)(?:\.git)?$/, link: (m, p, a, b) => `https://gitlab.com/${m[1]}/${m[2]}/-/blob/${hash}/${p}${a ? `#L${a}${b && b !== a ? `-${b}` : ''}` : ''}` },
  { name: 'Bitbucket', match: /bitbucket\.org[/:]([^/]+)\/([^/.]+)/, link: (m, p, a, b) => `https://bitbucket.org/${m[1]}/${m[2]}/src/${hash}/${p}${a ? `#lines-${a}${b && b !== a ? `:${b}` : ''}` : ''}` },
  { name: 'Azure DevOps', match: /dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/?]+)/, link: (m, p, a, b) => `https://dev.azure.com/${m[1]}/${m[2]}/_git/${m[3]}?path=/${p}&version=GC${hash}${a ? `&line=${a}&lineEnd=${b ?? a}&lineStartColumn=1&lineEndColumn=1&lineStyle=plain&_a=contents` : ''}` },
]
const host = HOSTS.map(h => ({ h, m: remote.match(h.match) })).find(x => x.m)
const linkFor = (path, from, to) => host ? host.h.link(host.m, path, from, to) : null

const tree = git('ls-tree', '-r', '--name-only', hash).split('\n')
const treeSet = new Set(tree)
const bySuffix = ref => tree.filter(t => t === ref || t.endsWith(`/${ref}`))
const lineCounts = new Map()
const lineCount = path => {
  if (!lineCounts.has(path)) lineCounts.set(path, git('show', `${hash}:${path}`).split('\n').length)
  return lineCounts.get(path)
}

const findings = []
const report = (kind, detail, hint) => findings.push({ kind, detail, hint })

// ---- 1. every existing repository link resolves in the clone -------------

const URL_PARSERS = [
  { re: /https:\/\/github\.com\/[^/\s"')]+\/[^/\s"')]+\/blob\/([0-9a-f]+)\/([^\s"'#)]+)(?:#L(\d+)(?:-L(\d+))?)?/g },
  { re: /https:\/\/gitlab\.com\/[^\s"')]+?\/-\/blob\/([0-9a-f]+)\/([^\s"'#)]+)(?:#L(\d+)(?:-(\d+))?)?/g },
  { re: /https:\/\/bitbucket\.org\/[^/\s"')]+\/[^/\s"')]+\/src\/([0-9a-f]+)\/([^\s"'#)]+)(?:#lines-(\d+)(?::(\d+))?)?/g },
  { re: /https:\/\/dev\.azure\.com\/[^\s"')]+?\/_git\/[^?\s"')]+\?path=\/([^&\s"')]+)&(?:amp;)?version=GC([0-9a-f]+)(?:&(?:amp;)?line=(\d+)&(?:amp;)?lineEnd=(\d+))?/g, swap: true },
]

function checkExistingLinks(text) {
  for (const { re, swap } of URL_PARSERS) {
    for (const m of text.matchAll(re)) {
      let [url, a, b, from, to] = m
      const [linkHash, path] = swap ? [b, a] : [a, b]
      const where = url.slice(0, 90)
      if (linkHash.length !== 40) report('short hash', where, `the host needs the 40-character hash ${hash}`)
      else if (linkHash !== hash) report('wrong commit', where, `the plan was written at ${hash.slice(0, 7)}`)
      if (!treeSet.has(path)) { report('path missing', where, `no such file at ${hash.slice(0, 7)}`); continue }
      if (from && +from > lineCount(path)) report('line out of range', where, `${path} has ${lineCount(path)} lines`)
      if (to && +to > lineCount(path)) report('line out of range', where, `${path} has ${lineCount(path)} lines`)
      if (from && to && +to < +from) report('line range reversed', where, 'lineEnd is before line')
    }
  }
}

// ---- 2. every mention of a file that exists at the commit is a link ------

const EXT = 'tsx?|[cm]?jsx?|py|go|rb|java|kt|cs|rs|php|swift|scala|json|ya?ml|toml|sql|css|scss|html|vue|svelte|md|cjs|mjs'
const REF = new RegExp(`(?<![\\w/@.-])((?:[\\w@.-]+/)*[\\w.-]+\\.(?:${EXT}))(?::(\\d+)(?:-(\\d+))?)?(?![\\w/])`, 'g')

const resolve = ref => {
  if (treeSet.has(ref)) return { path: ref }
  const hits = bySuffix(ref)
  if (hits.length === 1) return { path: hits[0] }
  if (hits.length > 1) return { ambiguous: hits }
  return null
}

const isMarkdown = /\.md$/i.test(file)

function* textSegments(html) {
  // Yields [text, isLinkable] over an HTML document. Text inside <a>, <svg>,
  // <title>, <script>, <style>, tags themselves and comments is not linkable.
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)[^>]*>/g
  const skip = new Set(['a', 'svg', 'title', 'script', 'style'])
  const open = []
  let last = 0, m
  while ((m = re.exec(html))) {
    yield [html.slice(last, m.index), open.length === 0]
    yield [m[0], false]
    last = re.lastIndex
    const tag = m[1]?.toLowerCase()
    if (tag && skip.has(tag)) {
      if (m[0].startsWith('</')) { if (open[open.length - 1] === tag) open.pop() }
      else if (!m[0].endsWith('/>')) open.push(tag)
    }
  }
  yield [html.slice(last), open.length === 0]
}

function* markdownSegments(md) {
  // Linkable text excludes fenced code blocks, existing links and bare URLs.
  const re = /```[\s\S]*?```|\[[^\]\n]*\]\([^)\n]*\)|https?:\/\/\S+/g
  let last = 0, m
  while ((m = re.exec(md))) {
    yield [md.slice(last, m.index), true]
    yield [m[0], false]
    last = re.lastIndex
  }
  yield [md.slice(last), true]
}

const esc = s => s.replace(/&/g, '&amp;')

function linkifyText(text, unlinked) {
  // In markdown a reference usually sits in backticks: wrap the whole span.
  const wrap = (token, ref, from, to) => {
    const hit = resolve(ref)
    if (!hit) return token
    if (hit.ambiguous) { report('ambiguous mention', ref, `qualify it: ${hit.ambiguous.slice(0, 3).join(', ')}`); return token }
    if (from && +from > lineCount(hit.path)) report('line out of range', `${ref}:${from}`, `${hit.path} has ${lineCount(hit.path)} lines`)
    unlinked.push(`${ref}${from ? `:${from}` : ''}`)
    if (!fix || !host) return token
    const url = linkFor(hit.path, from, to)
    return isMarkdown ? `[${token}](${url})` : `<a class="src-link" href="${esc(url)}">${token}</a>`
  }
  if (isMarkdown) {
    return text.replace(/`([^`\n]+)`|((?:[\w@.-]+\/)*[\w.-]+\.(?:tsx?|[cm]?jsx?|py|go|rb|java|kt|cs|rs|php|swift|scala|json|ya?ml|toml|sql|css|scss|html|vue|svelte|md))(?::(\d+)(?:-(\d+))?)?(?![\w/])/g, (token, code, bare, from, to) => {
      if (code !== undefined) {
        const m = code.match(new RegExp(`^((?:[\\w@.-]+/)*[\\w.-]+\\.(?:${EXT}))(?::(\\d+)(?:-(\\d+))?)?(?:[,:]\\s*\\d+)*$`))
        return m ? wrap(token, m[1], m[2], m[3]) : token
      }
      return wrap(token, bare, from, to)
    })
  }
  return text.replace(REF, (token, ref, from, to) => wrap(token, ref, from, to))
}

const original = await readFile(file, 'utf8').catch(() => { console.error(`check-links: cannot read ${file}`); process.exit(2) })
checkExistingLinks(original)

const unlinked = []
const segments = isMarkdown ? markdownSegments(original) : textSegments(original)
const rewritten = [...segments].map(([text, linkable]) => linkable ? linkifyText(text, unlinked) : text).join('')

if (unlinked.length) {
  const unique = [...new Set(unlinked)]
  if (fix && host) console.log(`linked ${unique.length} mention(s): ${unique.join(', ')}`)
  else report('unlinked mention', unique.join(', '), host ? 'run again with --fix, or link each one by hand' : 'the clone has no origin remote, so nothing can be linked; say so once in the provenance')
}
if (fix && rewritten !== original) await writeFile(file, rewritten)

const seen = new Set()
for (const f of findings) {
  const key = f.kind + f.detail
  if (seen.has(key)) continue
  seen.add(key)
  console.log(`${f.kind}: ${f.detail}\n    ${f.hint}`)
}
console.log(findings.length ? `\n${findings.length} finding(s).` : `\nNo findings. Links verified against ${repo} at ${hash.slice(0, 7)}${host ? ` (${host.h.name})` : ' (no remote, so no links)'}.`)
process.exit(findings.length ? 1 : 0)
