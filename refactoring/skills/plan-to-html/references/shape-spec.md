# The shape diagram: spec and drawing rules

`draw-shape.mjs` draws one panel of the shape-of-the-change diagram from a small JSON spec. Node 18 or later, no dependencies.

```bash
node draw-shape.mjs shape-today.json > shape-today.svg
node draw-shape.mjs shape-today.json --legend > shape-today.html
node draw-shape.mjs shape-today.json --suffix -ax > appendix-copy.svg
```

## The spec

```json
{
  "id": "shape-today",
  "title": "One or two sentences read aloud by a screen reader.",
  "nodes": [
    { "id": "ctrl", "label": "IntegrationController", "col": 0, "row": 0,
      "path": "src/integrations/integration.controller.ts" },
    { "id": "reg", "label": "ProviderRegistry", "col": 2, "row": 1, "kind": "after",
      "path": "src/integrations/provider.registry.ts" },
    { "id": "rest", "label": "7 other collaborators", "col": 2, "row": 2, "kind": "group",
      "files": ["src/integrations/a.ts", "src/integrations/b.ts", "..."] }
  ],
  "edges": [
    { "from": "ctrl", "to": "act" },
    { "from": "act", "to": "reg", "kind": "after" }
  ]
}
```

### Boxes

Every box has an `id`, a `label` of about twenty characters, and a `col` and `row` on the grid. No two boxes share a cell.

`kind` says what the box is:

| kind | Meaning | Drawn as |
|---|---|---|
| omitted | Exists today | Solid box |
| `after` | The plan creates it | Accent box |
| `gone` | The plan removes it, or it is the next thing the plan makes possible | Dashed box |
| `group` | Several untouched collaborators collapsed into one | Dotted box whose label carries their count |

`path` is the repository path the box stands for, relative to the clone root. The box itself is the link: a box with a path is wrapped in `<a data-path>` with a `<title>` naming the path, so a hover shows it and `check-links.mjs --fix` turns the box into a link to the file at the plan's commit.

A group box lists its `files` instead of a path. Its rect carries them as `data-files`, its `<title>` lists them one per line, and its link opens the deepest folder that holds them all. The page checker refuses a group box without `files`, so a `count` on its own is not enough, and a `count` given beside `files` must equal their number.

A box of kind `after` stands for a file that does not exist yet, so it carries its path and no link.

The dependency-graph verifier reads `data-path` and `data-files` instead of guessing from labels, which is why "legacy routers" is never the whole story.

### Edges

Every edge has a `from` and a `to`, both box ids. `kind` says what the arrow stands for:

| kind | Meaning | Drawn as |
|---|---|---|
| omitted | Exists today | Solid arrow |
| `after` | The plan adds it | Accent arrow |
| `future` | Made possible by the plan, added by no step | Dashed arrow |
| `back` | A dependency that points against the layering, a cycle that exists today | Dashed arrow in the caution colour, routed under the grid |
| `indirect` | A dependency that is not an import: an event both sides name, a queue, a shared table, a config key | Dotted arrow |

A `back` edge is refused in a panel that has anything of kind `after`, because a cycle after the plan is a defect for a step to remove, not a shape to draw.

### Options

`--suffix <text>` is appended to every id the SVG declares, which are its title and its arrowhead markers, so the same panel can appear twice on one page, on a slide and again in the appendix, without duplicate ids. Boxes and edges carry data attributes rather than ids and are unaffected.

`--legend` also prints an `<ol class="shape-legend">` after the SVG, one item per box, with the label and the path or files behind it as links, for a page that wants the paths in text as well. Every box then needs a `path` or `files`.

## How the panel is drawn

Every coordinate is computed from the column and row. Edges run left to right: they leave a box at its right edge and arrive at the next box's left edge, as horizontal and vertical segments only. A box with several edges in or out gets one port per edge, spaced down its edge, so no two arrowheads land on the same point. An edge that crosses a column travels along a row gutter, where there is never a box.

An edge that would have to point backwards is refused, because callers belong to the left of what they call. The one exception is an edge declared `back`: it leaves the caller's bottom edge, runs along a lane under the grid, and arrives at the callee's bottom edge, which needs the cells below both boxes to be free.

## The budget

A panel is a story, not an import graph. The generator refuses more than 8 boxes, more than 8 edges, or a box with more than 3 edges out or 3 edges in. Collapse the modules the claim does not need into one `group` box, drop the edges the slide's claim does not rest on, and let the title carry the full statement.
