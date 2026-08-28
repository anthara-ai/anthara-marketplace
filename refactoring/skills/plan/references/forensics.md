# Forensics: reading a module's history

What each command is for, how to read what it returns, and where the numbers lie. Run them from the repository root; `<module>` is the path being planned. Record the window and the commit hash in the plan's summary so the numbers can be reproduced.

## Fix the window first

```bash
git rev-parse --short HEAD
git log --oneline --since="12 months ago" -- <module> | wc -l
git rev-list --count HEAD
```

Twelve months is the usual window. A module with fewer than twenty commits in it needs a longer one. A shallow clone, where the last number is small for an old project, cannot support this analysis; say so in the plan and fetch the history first.

## Find and exclude the noise

Formatting sweeps, mass renames, lint fixes and vendored updates touch every file and make the whole module look hot. Find the commits that touched many files at once:

```bash
git log --since="12 months ago" --format='COMMIT %h %s' --name-only -- <module> \
  | awk '/^COMMIT/ { if (n > 15) print n, c; c = $0; n = 0; next } NF { n++ } END { if (n > 15) print n, c }'
```

Read their subjects. Name the ones that are noise in the plan and exclude them from every count below by adding `--invert-grep --grep='<subject fragment>'` to the `git log` calls.

## Change frequency

```bash
git log --since="12 months ago" --format= --name-only -- <module> | grep . | sort | uniq -c | sort -rn | head -25
```

The shape matters more than the numbers. One file with sixty commits and the rest under five is a module with one problem. Twenty files at ten each is a module whose boundary is wrong, or whose changes are all cross-cutting.

## Complexity, cheaply

Lines, and nesting measured by indentation, which is Tornhill's proxy and works in every language:

```bash
wc -l <file>
grep -cE '^( {16}|\t{4})' <file>
awk 'BEGIN { m = 0 } { match($0, /^[ \t]*/); if (RLENGTH > m) m = RLENGTH } END { print m }' <file>
```

The second number is lines nested four levels or deeper; the third is the deepest indentation in the file. Where the repository already has a complexity tool configured, such as eslint's `complexity` rule, `radon`, `lizard` or `gocyclo`, use it. Do not add tooling to write a plan.

## Hotspots

Rank the module's files by frequency and by complexity. A hotspot is high on both. Put them in a table in the plan: file, commits in the window, lines, deep lines. This table is the argument for where the plan spends its effort, and the argument against spending it anywhere else: complex code that does not change costs nothing, and simple code that changes often is fine as it is.

## Change coupling, outside the module

Files elsewhere in the repository that change in the same commits as the module:

```bash
git log --since="12 months ago" --format='%h' -- <module> \
  | while read h; do git show --format= --name-only "$h"; done \
  | grep -v "^<module>" | sort | uniq -c | sort -rn | head -15
```

Divide each count by the module's commit count. Above about a third, the file changes for the module's reasons. Either the boundary is drawn wrong and the file belongs inside, or this is Shotgun Surgery: one reason to change hitting several places. When the coupled file sits across an architectural line, a migration that travels with a controller, the abstraction between them leaks.

## Change coupling, inside the module

Which of the module's own files travel together, and which never do:

```bash
git log --since="12 months ago" --format='%h' -- <module> \
  | while read h; do git show --format= --name-only "$h" | grep "^<module>" | sort | paste -sd' ' -; done \
  | awk '{ for (i = 1; i <= NF; i++) for (j = i + 1; j <= NF; j++) pairs[$i " + " $j]++ } END { for (p in pairs) print pairs[p], p }' \
  | sort -rn | head -20
```

Pairs near the top belong near each other. A file that appears often in the frequency list and never in a pair changes for reasons of its own and may belong in a different module. Two files in the same folder that never co-change are not a cohesion problem by themselves; two responsibilities inside one file that never co-change are, and the X-ray below finds those.

## Code age

```bash
git ls-files <module> | while read f; do
  printf '%s %4s %s\n' "$(git log -1 --format=%cs -- "$f")" "$(git log --format=%h -- "$f" | wc -l | tr -d ' ')" "$f"
done | sort
```

Last change, total commits, file. Old with few commits is stable: leave it. Old with many commits settled long ago: leave it too. Recent with many is the hotspot. Recent with few is new code, not yet evidence of anything.

## Knowledge

```bash
git shortlog -sn --since="24 months ago" -- <module>
git shortlog -sn -- <file>
```

A file with one author who has left the team gets more characterisation tests, because nobody can say what is intentional, and the plan names a reviewer for it. A file with many authors and no majority has nobody who owns it, which is often why it is in the state it is in.

## Trend

Whether a hot file is still getting worse:

```bash
for rev in $(git log --since="12 months ago" --format=%h --reverse -- <file> | awk 'NR % 5 == 1'); do
  printf '%s %s %s\n' "$rev" "$(git show "$rev:<file>" | wc -l | tr -d ' ')" "$(git show "$rev:<file>" | grep -cE '^( {16}|\t{4})')"
done
```

Rising lines and rising deep lines: getting worse, and the strongest case for acting. Flat: plateaued. Falling: someone is already at it; find out who before planning over them.

## X-ray: the functions inside a hot file

Hunk headers carry the enclosing function's name for most languages git knows:

```bash
git log --since="12 months ago" --format= -p -- <file> \
  | grep -E '^@@' | sed -E 's/^@@[^@]*@@ *//; s/[({].*//' | sort | uniq -c | sort -rn | head -15
```

For one function's own history: `git log -L :<functionName>:<file> --format='%h %cs %s'`.

The functions at the top are the targets inside the file. A function that is both long and at the top of this list is the first refactoring. Functions in the same file that never share a commit are two responsibilities living together, which is Divergent Change, and the seam between them is where Extract Class goes.

## Where the numbers lie

- **Shallow clones** have no history to read. Fetch it.
- **Renames** reset a file's age and split its frequency. Use `--follow` for any file that looks newer than its code.
- **Squash merges** collapse a branch into one commit, so frequency undercounts and coupling overcounts. Widen the window and say so.
- **Generated files, lockfiles, snapshots and fixtures** change constantly and mean nothing. Exclude them.
- **Monorepos** show coupling to shared packages that is real but may be the package's fault, not the module's.
- **Bulk commits** are named and excluded, per the section above.
- **Author aliases** split one person into three. Check for a `.mailmap`.
- **A recent team change** produces churn from onboarding that cools by itself. Read the commit subjects before treating it as a hotspot.
