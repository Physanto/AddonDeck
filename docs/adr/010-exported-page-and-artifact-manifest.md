# 010. Exported page layout, embedded files by hash and an artifact manifest

- Status: Accepted
- Date: 2026-10-27

## Context

The exporter writes a page that the runtime reads, and that tools read back to edit the deck again. Three things had to be settled:

- Which compiled file holds each piece. The exporter runs in the browser and in Node.js, cannot import the packages it embeds, and must include only what a deck uses.
- How to keep text inside `<script>` elements from closing them, without losing a character of the deck text.
- How to embed an asset once when several references point at the same file, as with a logo repeated on every slide under different names.

## Decision

- Each package of compiled artifacts has a `manifest.json` that lists its pieces (runtime, blocks, adapters, themes) and their script and styles. The builds write it, and the exporter reads it through its `ArtifactSource`. A block definition's `needs` decides the adapters, and its new optional `assets(model)` the assets to embed.
- The deck text is escaped by adding a backslash after every `<` that comes before `/`, `!` or `\`, which is reversible. JSON writes `<` as `<`, and scripts and styles escape only their closing tags and `<!--`.
- `#addondeck-assets` holds `files`, each distinct file once under `sha256-<hex>`, and `assets`, each reference pointing at its file. The hash uses Web Crypto, present in browsers and Node.js.

The details are in [the exported page](../format/exported-page.md).

## Consequences

- Adding a block, an adapter or a theme package needs no change to the exporter: its build writes a manifest. Third-party packages work the same way.
- The runtime must read the escaped text back. A page written by hand with a literal `<\/` in its deck text reads it as `</`.
- A file shared by several references weighs once. Reading an asset takes one more lookup.
- The manifest is a contract between packages. Changing its layout needs a new `manifest` version.
- A block that shows assets must implement `assets`, or an exported deck shows a frame in place of each asset.
