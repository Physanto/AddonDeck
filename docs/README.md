# Contributor map

A short guide to how AddonDeck is organized, for anyone who wants to work on it. For setup, commands and pull request rules, see [CONTRIBUTING.md](../CONTRIBUTING.md).

> The project is under construction: the packages below exist as skeletons, and sections marked _(planned)_ describe the intended design.

## What AddonDeck does

AddonDeck turns a short text format, `.deck`, into an animated presentation saved as a single `index.html` that opens with a double click.

The text can come from three places, and the engine treats them the same way:

- **Forms and presets** in the Studio, for people who don't want to write anything.
- **A language model**, in a chat or a coding agent, which writes the `.deck` text.
- **A person or a developer**, who writes the text and can add their own blocks.

```
.deck text ──▶ core: parse and validate ──▶ Deck + diagnostics
                                                │
                                                ▼
                     exporter: collect only what the deck uses
                                                │
                                                ▼
           index.html = runtime + used blocks + needed libraries + theme + assets
```

When someone opens the exported file, the runtime reads the embedded deck text, applies the theme, mounts the blocks of the current slide and plays their steps as the presenter moves forward or back.

The text format is specified in [docs/format/v1.md](format/v1.md): what each line means, the defaults, and every diagnostic code.

The exported file is described in [docs/format/exported-page.md](format/exported-page.md): its layout, how the deck text and the assets are embedded, and the artifact manifest each package of compiled scripts provides.

## Design principles

These settle most discussions. A change that breaks one needs a [decision record](adr/).

1. **One file, double click.** Presenting never needs a server, Node.js or an internet connection.
2. **The text is the API.** The format looks like Markdown, is versioned and forgives mistakes.
3. **Models direct, the engine draws.** Authors never write navigation, scaling, steps or base styles.
4. **Everything is a plugin.** Blocks, verbs, themes, assets and languages are added without touching the core.
5. **Deterministic steps.** Every step of a slide has a reproducible state, so going back, jumping and printing just work.
6. **Motion comes from the theme.** No block uses fixed durations or easings.
7. **Only what is used is included.** The exporter embeds only the blocks, libraries and assets a deck needs.
8. **Zero running costs.** Everything runs in the user's browser or terminal.
9. **Accessible by default.** Keyboard navigation, alternative text, contrast and reduced motion.
10. **Clean licenses.** Exported files only contain permissively licensed code (see [CONTRIBUTING.md](../CONTRIBUTING.md#dependency-and-asset-licenses)).

## Repository layout

| Path                           | Contents                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `packages/`                    | The libraries that make up the engine (table below)                                               |
| `apps/studio/`                 | The web app: forms, editor, live preview and export                                               |
| `apps/cli/`                    | The `addondeck` command line tool                                                                 |
| `tooling/`                     | Checks for the repository itself, such as the dependency rule tests and the changeset check       |
| [`docs/adr/`](adr/)            | Architecture decision records                                                                     |
| [`licenses/`](../licenses/)    | Full license texts of third-party components                                                      |
| [`docs/format/`](format/v1.md) | Specification of the `.deck` format, the source of truth for the parser, and of the exported page |
| `docs/guides/`                 | _(planned)_ How to create a block, a verb, a theme or a translation                               |
| [`examples/`](../examples/)    | Example decks, which double as a gallery and as tests                                             |
| `ai/`                          | _(planned)_ Instructions and evals for using AddonDeck with language models                       |

## Packages

Each package has one responsibility. The "Must never" column is what keeps the system easy to extend.

| Package        | Responsibility                                                                                   | May import                    | Must never                                       |
| -------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------ |
| `core`         | Turn `.deck` text into a `Deck` plus diagnostics; keyword aliases and property schemas           | —                             | Touch the DOM or know any concrete block         |
| `sdk`          | Contracts for plugins (`BlockDefinition`, `BlockView`, `BlockContext`, `Animator`…) and test kit | `core`                        | Contain heavy implementations                    |
| `runtime`      | Render slides, run steps, navigation, themes and presenter mode in the browser                   | `core`, `sdk`                 | Import a concrete block or library               |
| `adapters`     | Implement SDK interfaces with real libraries (animation, physics, charts, highlighting)          | `sdk`                         | Contain presentation logic                       |
| `blocks`       | One folder per block: read its text, draw itself, animate its steps, document itself             | `core`, `sdk`                 | Import another block or a library directly       |
| `themes`       | Theme data and CSS, motion personalities and presets by subject                                  | `core`                        | Contain logic                                    |
| `assets`       | Catalog of emojis, icons, fonts and backgrounds, with licenses and resolvers                     | `core`                        | —                                                |
| `exporter`     | Analyze a deck, gather what it uses and embed it in one HTML file (or a zip)                     | `core`, `assets`              | Depend on the DOM or on the file system directly |
| `studio` (app) | Web interface                                                                                    | `core`, `exporter`, `runtime` | Reimplement parsing or rendering                 |
| `cli` (app)    | Terminal interface                                                                               | `core`, `exporter`, `blocks`  | Reimplement parsing or rendering                 |

## The dependency rule

Dependencies always point inward, toward `core` and `sdk`. `core` depends on nothing.

```
 apps:      studio ──┐      cli ──┐
                     ▼            ▼
                    exporter ─────┴──▶ assets
                        │
                        ▼
 engine:               core ◀──── sdk ◀──── runtime
                        ▲          ▲  ▲
                        │          │  └──── adapters
                     themes        └─────── blocks
```

The command line imports `blocks` only for their definitions (`BLOCK_DEFINITIONS`), which are pure: it parses decks with them. It reads the compiled scripts of `runtime`, `blocks` and `adapters` as files, through their `manifest.json`, and never imports them.

`pnpm check` verifies it with [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), using the rules in [`.dependency-cruiser.mjs`](../.dependency-cruiser.mjs), and CI runs the same check on every pull request. Besides the table above, it also rejects:

- a block importing another block;
- `runtime` or `blocks` importing an npm library (they go through `adapters`);
- any package other than `adapters` importing anime.js, which everything else reaches through the `Animator` of the SDK;
- `core` or `exporter` importing Node.js built-ins, since both also run in the browser;
- circular imports and imports of packages not declared in `package.json`.

`core`, `themes`, `assets` and `exporter` are type-checked without the DOM library, so DOM access fails to compile there.

To import another workspace package, add it to `dependencies` with `"workspace:*"` and import it by name (`@addondeck/core`). Packages resolve each other's TypeScript sources directly, so no build is needed for tests or type checks.

## Adding a block

A block is a folder under `packages/blocks/src/`, discovered automatically by the build and by the development page, so adding one doesn't require editing any other file:

```
packages/blocks/src/sequence/
├── definition.ts     # exports `definition`: type, aliases, parse and steps; pure, no DOM
├── view.ts           # exports `view`: mount, draws and animates through BlockContext
├── messages.ts       # English messages of its diagnostics, `SEQUENCE-W01` and so on
├── styles.css        # theme variables only, never fixed colors
├── docs.md           # short English documentation, also read by language models
├── examples/         # .deck examples, which are also tests
└── sequence.test.ts
```

Every block passes the same contract suite, `runBlockContract` from `@addondeck/sdk/testing`: `parse` never throws, `setState(n)` is idempotent and matches the result of animating to step `n`, going back works, `destroy()` leaves nothing behind, and the docs and examples are valid. The [SDK readme](../packages/sdk/README.md) lists every rule and the shared helpers (Markdown, revealing elements, diagnostics); the [blocks readme](../packages/blocks/README.md) describes what the build produces. `text`, `list` and `image` are small examples to start from. To propose a block, open a "New block" issue.

## Adding a theme _(planned)_

A theme will be data: colors, fonts, corner radius, background and a motion personality. The runtime turns it into CSS variables (`--color-primary`, `--font-heading`…), and blocks use only those variables. A motion personality sets durations, easings and stagger, and a minimal personality applies automatically when the system asks for reduced motion.

## Decision records

| ADR                                                   | Decision                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| [001](adr/001-own-engine.md)                          | Own presentation engine instead of Slidev                             |
| [002](adr/002-classic-script-runtime.md)              | Runtime as a classic script (IIFE)                                    |
| [003](adr/003-animejs-over-gsap.md)                   | anime.js v4 instead of GSAP                                           |
| [004](adr/004-text-as-the-api.md)                     | The `.deck` text is the only API, with no server                      |
| [005](adr/005-single-html-output.md)                  | A single HTML file as the default output                              |
| [006](adr/006-pnpm-monorepo.md)                       | Monorepo with pnpm workspaces                                         |
| [007](adr/007-apache-2-license.md)                    | Apache License 2.0                                                    |
| [008](adr/008-english-and-language-packs.md)          | English repository, other languages as language packs                 |
| [009](adr/009-own-markdown-subset.md)                 | Own Markdown subset that builds the DOM                               |
| [010](adr/010-exported-page-and-artifact-manifest.md) | Exported page layout, embedded files by hash and an artifact manifest |

To record a new decision, copy [the template](adr/000-template.md).
