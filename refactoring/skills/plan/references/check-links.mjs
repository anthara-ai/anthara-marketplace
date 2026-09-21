#!/usr/bin/env node
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
  { name: 'GitHub', match: /github\.com[/:]([^/]+)\/([^/.]+)/, link: (m, p, a, b) => `https://github.com/${m[1]}/${m[2]}/blob/${hash}/${p}${a ? `#L${a}${b && b !== a ? `-L${b}` : ''}` : ''}`, folder: (m, p) => `https://github.com/${m[1]}/${m[2]}/tree/${hash}/${p}` },
  { name: 'GitLab', match: /gitlab\.com[/:](.+?)\/([^/.]+)(?:\.git)?$/, link: (m, p, a, b) => `https://gitlab.com/${m[1]}/${m[2]}/-/blob/${hash}/${p}${a ? `#L${a}${b && b !== a ? `-${b}` : ''}` : ''}`, folder: (m, p) => `https://gitlab.com/${m[1]}/${m[2]}/-/tree/${hash}/${p}` },
  { name: 'Bitbucket', match: /bitbucket\.org[/:]([^/]+)\/([^/.]+)/, link: (m, p, a, b) => `https://bitbucket.org/${m[1]}/${m[2]}/src/${hash}/${p}${a ? `#lines-${a}${b && b !== a ? `:${b}` : ''}` : ''}`, folder: (m, p) => `https://bitbucket.org/${m[1]}/${m[2]}/src/${hash}/${p}` },
  { name: 'Azure DevOps', match: /dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/?]+)/, link: (m, p, a, b) => `https://dev.azure.com/${m[1]}/${m[2]}/_git/${m[3]}?path=/${p}&version=GC${hash}${a ? `&line=${a}&lineEnd=${b ?? a}&lineStartColumn=1&lineEndColumn=1&lineStyle=plain&_a=contents` : ''}`, folder: (m, p) => `https://dev.azure.com/${m[1]}/${m[2]}/_git/${m[3]}?path=/${p}&version=GC${hash}` },
]
const host = HOSTS.map(h => ({ h, m: remote.match(h.match) })).find(x => x.m)
const linkFor = (path, from, to) => host ? host.h.link(host.m, path, from, to) : null
const folderLinkFor = path => host ? host.h.folder(host.m, path) : null

const tree = git('ls-tree', '-r', '--name-only', hash).split('\n')
const treeSet = new Set(tree)
const folderSet = new Set(tree.flatMap(path => path.split('/').slice(0, -1).map((_, depth, parts) => parts.slice(0, depth + 1).join('/'))))
const bySuffix = ref => tree.filter(t => t === ref || t.endsWith(`/${ref}`))
const lineCounts = new Map()
const lineCount = path => {
  if (!lineCounts.has(path)) lineCounts.set(path, git('show', `${hash}:${path}`).split('\n').length)
  return lineCounts.get(path)
}

const findings = []
const report = (kind, detail, hint) => findings.push({ kind, detail, hint })

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
      if (!treeSet.has(path) && !folderSet.has(path)) { report('path missing', where, `no such file or folder at ${hash.slice(0, 7)}`); continue }
      if (!treeSet.has(path)) continue
      if (from && +from > lineCount(path)) report('line out of range', where, `${path} has ${lineCount(path)} lines`)
      if (to && +to > lineCount(path)) report('line out of range', where, `${path} has ${lineCount(path)} lines`)
      if (from && to && +to < +from) report('line range reversed', where, 'lineEnd is before line')
    }
  }
}

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

const TAGS_WHOSE_TEXT_IS_NEVER_LINKED = new Set(['a', 'svg', 'title', 'script', 'style'])

function trackUnlinkableTag(markup, tagName, openTags) {
  const tag = tagName?.toLowerCase()
  if (!tag || !TAGS_WHOSE_TEXT_IS_NEVER_LINKED.has(tag)) return
  if (markup.startsWith('</')) { if (openTags[openTags.length - 1] === tag) openTags.pop(); return }
  if (!markup.endsWith('/>')) openTags.push(tag)
}

function* htmlSegments(html) {
  const commentOrTag = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)[^>]*>/g
  const openUnlinkableTags = []
  let last = 0, match
  while ((match = commentOrTag.exec(html))) {
    yield [html.slice(last, match.index), openUnlinkableTags.length === 0]
    yield [match[0], false]
    last = commentOrTag.lastIndex
    trackUnlinkableTag(match[0], match[1], openUnlinkableTags)
  }
  yield [html.slice(last), openUnlinkableTags.length === 0]
}

function* markdownSegments(markdown) {
  const fencedCodeOrLinkOrBareUrl = /```[\s\S]*?```|\[[^\]\n]*\]\([^)\n]*\)|https?:\/\/\S+/g
  let last = 0, match
  while ((match = fencedCodeOrLinkOrBareUrl.exec(markdown))) {
    yield [markdown.slice(last, match.index), true]
    yield [match[0], false]
    last = fencedCodeOrLinkOrBareUrl.lastIndex
  }
  yield [markdown.slice(last), true]
}

const esc = text => text.replace(/&/g, '&amp;')

function linkedMention(token, ref, from, to, unlinked) {
  const hit = resolve(ref)
  if (!hit) return token
  if (hit.ambiguous) { report('ambiguous mention', ref, `qualify it: ${hit.ambiguous.slice(0, 3).join(', ')}`); return token }
  if (from && +from > lineCount(hit.path)) report('line out of range', `${ref}:${from}`, `${hit.path} has ${lineCount(hit.path)} lines`)
  unlinked.push(`${ref}${from ? `:${from}` : ''}`)
  if (!fix || !host) return token
  const url = linkFor(hit.path, from, to)
  return isMarkdown ? `[${token}](${url})` : `<a class="src-link" href="${esc(url)}">${token}</a>`
}

const MENTION = `((?:[\\w@.-]+/)*[\\w.-]+\\.(?:${EXT}))(?::(\\d+)(?:-(\\d+))?)?`
const BACKTICKED_SPAN_OR_BARE_MENTION = new RegExp(`\`([^\`\\n]+)\`|${MENTION}(?![\\w/])`, 'g')
const MENTION_FILLING_A_BACKTICKED_SPAN = new RegExp(`^${MENTION}(?:[,:]\\s*\\d+)*$`)

function linkifyMarkdown(text, unlinked) {
  return text.replace(BACKTICKED_SPAN_OR_BARE_MENTION, (token, backticked, bare, from, to) => {
    if (backticked === undefined) return linkedMention(token, bare, from, to, unlinked)
    const mention = backticked.match(MENTION_FILLING_A_BACKTICKED_SPAN)
    return mention ? linkedMention(token, mention[1], mention[2], mention[3], unlinked) : token
  })
}

const linkifyHtml = (text, unlinked) => text.replace(REF, (token, ref, from, to) => linkedMention(token, ref, from, to, unlinked))
const linkifyText = isMarkdown ? linkifyMarkdown : linkifyHtml

const BOX_LINK = /<a\b([^>]*\bdata-path="([^"]+)"[^>]*)>/g

function linkBoxes(html, unlinkedBoxes) {
  return html.replace(BOX_LINK, (tag, attrs, path) => {
    const target = resolveBoxTarget(path)
    if (!target) { report('path missing', `box for ${path}`, `no such file or folder at ${hash.slice(0, 7)}; fix the path in the shape spec and redraw`); return tag }
    if (/\bhref="[^"]+"/.test(attrs)) return tag
    unlinkedBoxes.push(path)
    if (!fix || !host) return tag
    return `<a${attrs} href="${esc(target)}">`
  })
}

const resolveBoxTarget = path => treeSet.has(path) ? linkFor(path) : folderSet.has(path) ? folderLinkFor(path) : null

const STEM_EXT = new RegExp(`\\.(?:${EXT})$`)
const stems = new Map()
for (const path of tree) {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const stem = base.replace(STEM_EXT, '')
  if (stem === base || !/[.\-_]/.test(stem)) continue
  stems.set(stem, stems.has(stem) ? null : path)
}
const STEM_TOKEN = /(?<![\w/@.#-])([\w-]+(?:\.[\w-]+)*)(?![\w/.])/g

function findNamesWithoutExtension(text, linkedPaths, found) {
  for (const [, token] of text.matchAll(STEM_TOKEN)) {
    const path = stems.get(token)
    if (!path || STEM_EXT.test(token) || linkedPaths.has(path)) continue
    found.set(token, path)
  }
}

const linkedPathsOn = text => new Set([
  ...[...text.matchAll(/data-path="([^"]+)"/g)].map(m => m[1]),
  ...[...text.matchAll(/(?:blob|src|tree)\/[0-9a-f]{40}\/([^\s"'#)?]+)/g)].map(m => m[1]),
  ...[...text.matchAll(/\?path=\/([^&\s"')]+)/g)].map(m => m[1]),
])

const original = await readFile(file, 'utf8').catch(() => { console.error(`check-links: cannot read ${file}`); process.exit(2) })
checkExistingLinks(original)

const unlinked = []
const unlinkedBoxes = []
const namesWithoutExtension = new Map()
const segments = isMarkdown ? markdownSegments(original) : htmlSegments(original)
const linkedPaths = linkedPathsOn(original)
const rewrittenText = [...segments].map(([text, linkable]) => {
  if (!linkable) return text
  findNamesWithoutExtension(text, linkedPaths, namesWithoutExtension)
  return linkifyText(text, unlinked)
}).join('')
const rewritten = isMarkdown ? rewrittenText : linkBoxes(rewrittenText, unlinkedBoxes)

if (unlinkedBoxes.length) {
  const unique = [...new Set(unlinkedBoxes)]
  if (fix && host) console.log(`linked ${unique.length} box(es) in the shape diagram: ${unique.join(', ')}`)
  else report('unlinked box', unique.join(', '), host ? 'run again with --fix' : 'the clone has no origin remote, so nothing can be linked; say so once in the provenance')
}
for (const [token, path] of namesWithoutExtension) {
  report('file named without its extension', token, `write it as ${path.slice(path.lastIndexOf('/') + 1)} (or link ${path} once on the page) so the reader can open it`)
}

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
