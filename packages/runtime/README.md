# @addondeck/runtime

In-browser engine that renders, steps and navigates a deck.

It parses the deck text with `@addondeck/core`, draws the slides on a fixed stage and moves through them with the keyboard, clicks, swipes and the address hash. It never imports a concrete block or library: blocks and adapters register themselves.

## In an exported page

Exported decks open with a double click, from `file://`, where browsers refuse module scripts. So the runtime ships as a classic script, `dist/browser.iife.js` (export `@addondeck/runtime/browser`), that defines one global, `AddonDeck`, with two functions:

```html
<style>/* dist/runtime.css + theme */</style>
<div id="addondeck"></div>
<script type="text/addondeck" id="addondeck-source">…deck text…</script>
<script type="application/json" id="addondeck-assets">{…}</script>
<script>/* dist/browser.iife.js */</script>
<script>/* each block and adapter: AddonDeck.register(plugin) */</script>
<script>AddonDeck.start();</script>
```

- `AddonDeck.register(plugin)` adds a block (`{ kind: "block", definition, view }`) or an adapter (`{ kind: "adapter", adapter, create }`). A malformed plugin, or a second one with the same type, keyword or adapter kind, throws.
- `AddonDeck.start()` reads the deck text and the assets, and shows the deck in `#addondeck`. Calling it again returns the deck already shown.

The assets element is optional. It holds a JSON object whose keys are the references written in the deck and whose values are resolved assets: `{ "image:logo.png": { "kind": "image", "url": "data:…", "credit": "…" } }`.

Problems go to the browser console, worded from the runtime's text catalog. A block the parser does not know is reported as a block whose script is missing, and a block whose adapter is missing shows the problem in its place.

## Navigation

| Input                                          | Action                                           |
| ---------------------------------------------- | ------------------------------------------------ |
| `→`, `Space`, `Page Down`, `Enter`, click, tap | Next click of the slide, or the next slide       |
| `←`, `Page Up`, `Backspace`                    | Previous click, or the end of the previous slide |
| `Home`, `End`                                  | Start of the deck, end of the deck               |
| Swipe left, swipe right                        | Next, previous                                   |
| `F`                                            | Full screen on and off                           |

Keys pressed with Ctrl, Alt or Meta, keys typed in form fields, and clicks on links and buttons are left to the browser.

The address hash is the position, `#/slide/step`, both counted from 1: `#/3` (or `#/3/1`) is slide 3 before any click, `#/3/2` is slide 3 after its first click. Opening that address shows that position, and every move rewrites it in place, without adding history entries, so it also works from `file://`.

## Stage and slides

Slides are drawn on a 1920×1080 stage scaled to fit its container, with bands on the sides or above and below; it refits when the window or the container changes size. Blocks lay themselves out in stage pixels.

Without a `layout` option, text that starts a slide followed by more content becomes its header; then one piece fills the slide, two sit side by side and more stack in rows. `layout=columns` and `layout=rows` choose the flow.

The current slide and its two neighbors stay mounted, the neighbors hidden and inert, so moving to them is immediate; slides further away are destroyed.

Text is drawn by the registered `text` block, read as if it were written as `text:` with the same lines; its annotated lines are steps like those of any block. Content without a block to draw it shows a placeholder with its type and its text: text while no `text` block is registered, and blocks that are not registered, could not be read or failed to mount.

## Steps

Each slide has a step plan, compiled from its blocks and its annotated text (see [Step plan](../../docs/format/v1.md#step-plan)), and a step timeline that plays it:

- Moving to the next click animates: every block that advances in it plays `play(from, to)` at the same time.
- Any other move, backwards, from the address hash or to another slide, shows the step at once with `setState`. A block's state after `n` clicks is the end of its last advance among them.
- A click that arrives while the previous one animates first jumps its animations to their end and sets its blocks to its state, then goes on. However fast the presenter clicks, the slide ends as slow clicks would leave it.
- Leaving a slide finishes the click it was animating. The previous slide waits at its end and the next one at its start, as moving to them finds them.

A block that throws or rejects while changing step is reported and set to the step's state; the presentation goes on.

## Theme and motion

The theme engine resolves the header's `theme` and `motion`, writes `color`, `accent` and `font` over the theme, and sets the result as CSS variables on the viewport: `--color-*`, `--font-*` and `--radius` for blocks, and `--adk-duration-*` and `--adk-easing-*` for the runtime's own transitions. The variables live on the deck's element, so several decks in one page keep their own theme.

Until the theme catalog arrives, the runtime ships the `paper` theme and the `smooth` and `minimal` personalities; other names fall back to `paper` and `smooth`. When the system asks for reduced motion, `minimal` is used whatever the deck says, and the setting is followed while the deck is shown. With `minimal` everything changes at once: durations are 0 and blocks get an animator without motion.

Each block receives its own `BlockContext`: the shared animator, theme, motion, assets, events and stage, plus a physics world, a chart renderer or a highlighter only when its definition declares them in `needs`. A physics world belongs to its block and is destroyed with it.

## Events

The runtime emits `slide:leave`, `slide:enter` and `step:change` on the bus every block shares (payloads typed by `RuntimeEvents` in `@addondeck/sdk`). Moving to another slide emits the three in that order; a click inside a slide emits only `step:change`; the first slide shown emits `slide:enter`. `runtime.events` gives the same bus to the code that hosts the deck.

## Transitions

A slide's `transition` (`none`, `fade`, `slide` or `zoom`; `fade` by default) plays when moving to it from the previous slide, and in reverse when moving back from it, using the motion tokens. Jumping further, from the address hash or with `Home` and `End`, cuts. With reduced motion, transitions take no time.

## Problems and watermark

Problems found in the deck text are shown in a card on the slide they belong to (header problems on the first slide). `createRuntime` shows warnings and errors, for previews; an exported page (`AddonDeck.start()`) shows the card only for errors, since the audience sees it. The `problems` option (`"all"` or `"errors"`) chooses. The card can be folded, and clicking its title does not move forward.

Unless the header says `watermark: off`, a small "Made with AddonDeck" badge, worded from the text catalog, sits in the bottom right corner, inside the slide padding where blocks never draw.

## As a library

`createRuntime({ root, source, registry })` shows a deck inside any element, which is how the Studio previews and how the development page works. The package also exports the parts it is built from: `createPluginRegistry`, `createNavigator`, `createStepTimeline` and `stepStates`, `createThemeEngine`, `resolveTheme`, `resolveMotion` and `themeVariables`, `fitStage`, `parseDeckHash` and `formatDeckHash`, `arrangeSlide` and the English text catalog.

## Development page

```sh
pnpm --filter @addondeck/runtime dev:page
```

Opens any deck of `examples/` with the runtime sources. Editing a deck or the runtime reloads the page; the address keeps the deck (`?deck=hello`) and the position. The page lives in `dev/` and is not published.

> Status: stage, navigation, steps, themes, events, transitions, the problem card and the watermark are in place; the presenter view, overview, sections and print come next. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
