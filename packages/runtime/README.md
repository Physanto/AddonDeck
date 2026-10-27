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

The current slide and its two neighbors stay mounted, the neighbors hidden and inert, so moving to them is immediate; slides further away are destroyed. Content without a block to draw it shows a placeholder with its type and its text.

## As a library

`createRuntime({ root, source, registry })` shows a deck inside any element, which is how the Studio previews and how the development page works. The package also exports the parts it is built from: `createPluginRegistry`, `createNavigator`, `fitStage`, `parseDeckHash` and `formatDeckHash`, `arrangeSlide` and the English text catalog.

## Development page

```sh
pnpm --filter @addondeck/runtime dev:page
```

Opens any deck of `examples/` with the runtime sources. Editing a deck or the runtime reloads the page; the address keeps the deck (`?deck=hello`) and the position. The page lives in `dev/` and is not published.

> Status: stage, navigation and start-up are in place; steps, themes, events and transitions come next. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
