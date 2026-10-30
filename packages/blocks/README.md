# @addondeck/blocks

Built-in AddonDeck blocks.

| Block   | What it draws                                                             | Docs                      |
| ------- | ------------------------------------------------------------------------- | ------------------------- |
| `text`  | Markdown; the implicit block of every text line, steps per annotated line | [docs](src/text/docs.md)  |
| `list`  | Items that appear one per step, or all at once with `reveal=all`          | [docs](src/list/docs.md)  |
| `image` | An image that fills its space, with alt text and `fit`                    | [docs](src/image/docs.md) |

Outside the browser, `BLOCK_DEFINITIONS` holds the definitions of every built-in block, to parse decks with: `createBlockRegistry(BLOCK_DEFINITIONS)`. Importing it loads no view and touches no DOM; the command line uses it.

## Anatomy of a block

Every block lives in its own folder under `src/` and only talks to the SDK. Blocks never import each other or third-party libraries directly.

```
src/list/
├── definition.ts   # exports `definition`: type, aliases, parse, steps and assets; pure, no DOM
├── view.ts         # exports `view`: mount, draws and animates through BlockContext
├── messages.ts     # English messages of the block's diagnostics, by code
├── styles.css      # theme variables only, `adk-` classes, sizes in stage pixels
├── docs.md         # short English documentation, also read by language models
├── examples/       # .deck examples, which are also tests
└── list.test.ts    # runBlockContract plus the block's own tests
```

Diagnostic codes are `<TYPE>-<letter><number>`, such as `LIST-W03`, and are listed in the block's `docs.md`. Shared behavior (Markdown, step annotations, revealing elements, diagnostics) comes from `@addondeck/sdk`.

## Build

The build finds the blocks itself: every folder of `src/` with a `definition.ts` is a block, so adding a block is adding a folder. For each one it produces:

| Output                        | Import as                             | Used by                                   |
| ----------------------------- | ------------------------------------- | ----------------------------------------- |
| `dist/<type>/definition.js`   | `@addondeck/blocks/<type>/definition` | The command line and the exporter (parse) |
| `dist/<type>/view.js`         | `@addondeck/blocks/<type>/view`       | The Studio preview                        |
| `dist/<type>/styles.css`      | `@addondeck/blocks/<type>/styles.css` | Every page that shows the block           |
| `dist/browser/<type>.iife.js` | `@addondeck/blocks/browser/<type>`    | Exported decks                            |

The browser file is a classic script that registers the block with `AddonDeck.register` when it loads, after the runtime script, so an exported deck works from `file://` ([ADR 002](../../docs/adr/002-classic-script-runtime.md)). It carries the parts of `core` and `sdk` the block uses.

The build also writes `dist/manifest.json`, which tells the exporter the script and the styles of each block ([exported page](../../docs/format/exported-page.md)).

The runtime's development page loads every block from its sources and lists each block's examples: `pnpm --filter @addondeck/runtime dev:page`.

> Status: `text`, `list` and a simple `image` are in place. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
