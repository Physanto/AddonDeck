# The exported page

An exported deck is one HTML file that opens with a double click, from `file://`, with no server ([ADR 005](../adr/005-single-html-output.md)). This page describes what the file holds, so that the exporter, the runtime and any tool that reads the file back (such as the Studio) agree on it. The design is recorded in [ADR 010](../adr/010-exported-page-and-artifact-manifest.md).

## Layout

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="AddonDeck 0.1.0">
<meta name="author" content="…">
<meta name="addondeck-credits" content="…">
<title>…</title>
<style>/* runtime, theme, then each block, in that order */</style>
</head>
<body>
<div id="addondeck"></div>
<script type="text/addondeck" id="addondeck-source">…deck text, escaped…</script>
<script type="application/json" id="addondeck-assets">{…}</script>
<script>/* runtime */</script>
<script>/* each adapter */</script>
<script>/* each block */</script>
<script>AddonDeck.start();</script>
</body>
</html>
```

- `lang` is the deck's `language:`, and `<title>` its title (the `title:` line, or else the first level-1 heading). An untitled deck gets the exporter's "Untitled deck" text.
- `generator` names the version of the runtime the page embeds.
- `author` is present when the header has `author:`, and `addondeck-credits` when an embedded asset carries an attribution, with each one separated by `; `.
- Every script is a classic script (ADR 002). Blocks and adapters register themselves with `AddonDeck.register` as they run; `AddonDeck.start()` then reads the deck text and the assets and shows the deck.
- A page exported without the watermark ends with `AddonDeck.start({ watermark: false })` instead, which hides it whatever the deck's `watermark:` says. The deck text stays as written.
- The page holds only what the deck uses: the `text` block when the deck has text, the other blocks it draws, the animator unless its `motion:` is `minimal`, the adapters its blocks declare in `needs`, and the assets its blocks name with `assets`. A deck without assets has no `#addondeck-assets` element.

## The deck text

`#addondeck-source` holds the deck text exactly as written, so the file can be opened again for editing. The contents of a `<script>` element end at the first `</script`, and `<!--` followed by `<script` can keep the element open past its closing tag, so the text is escaped by adding a backslash after every `<` that comes before `/`, `!` or `\`:

| Written | Embedded |
| ------- | -------- |
| `</`    | `<\/`    |
| `<!`    | `<\!`    |
| `<\`    | `<\\`    |

Reading reverses each of these, which restores any text exactly. `@addondeck/core` provides both directions as `escapeEmbeddedSource` and `unescapeEmbeddedSource`.

## The assets

`#addondeck-assets` holds a JSON object. `files` holds each distinct file once, as a `data:` URL, under the key `sha256-<hex>`, the SHA-256 hash of its bytes. `assets` holds each reference written in the deck, pointing at its file:

```json
{
	"files": {
		"sha256-9f86…": "data:image/png;base64,iVBORw0KGgo…"
	},
	"assets": {
		"image:team.jpg": { "kind": "image", "file": "sha256-9f86…" },
		"image:team-copy.jpg": {
			"kind": "image",
			"file": "sha256-9f86…",
			"credit": "Photo by …"
		}
	}
}
```

- `kind` is one of `emoji`, `icon`, `image`, `video`, `background` and `font`.
- `credit` is the attribution the asset's license asks for, when it asks for one.
- An entry may carry its own `url` in place of `file`, for pages written by hand.
- Every `<` in the JSON is written as `<`, so the text never closes its element.

The runtime leaves out, and reports on the console, any entry that is not valid.

## Scripts and styles

Inlined code is changed only where it could end its element, and always in a way the language reads as the original characters:

- In a script, `</script` (any case) becomes `<\/script`, and `<!--` becomes `<\x21--`.
- In the style sheet, `</style` (any case) becomes `<\/style`.

## The artifact manifest

The exporter learns which compiled file holds each piece from a `manifest.json` at the root of each package of artifacts. The builds of `@addondeck/runtime`, `@addondeck/blocks` and `@addondeck/adapters` write it to their `dist/`, and each package exports it as `<package>/manifest.json`, so a tool finds the folder of the artifacts by resolving that path:

```json
{
	"manifest": 1,
	"name": "@addondeck/blocks",
	"version": "0.1.0",
	"pieces": [
		{
			"kind": "block",
			"name": "list",
			"script": "browser/list.iife.js",
			"styles": "list/styles.css"
		}
	]
}
```

- `kind` is `runtime`, `block`, `adapter` or `theme`. `name` is the block type, the adapter kind, the theme name, or `runtime`.
- `script` and `styles` are paths relative to the folder of the manifest. A piece has at least one of them, and a block or an adapter needs its `script`.
- When two packages offer the same piece, the exporter takes it from the first package it was given.
