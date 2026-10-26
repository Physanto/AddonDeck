# 002. Runtime as a classic script (IIFE)

- Status: Accepted
- Date: 2026-10-25

## Context

An exported presentation is a single HTML file opened from the local disk (`file://`). Browsers refuse to fetch JavaScript modules from `file://` pages: `<script type="module" src="…">` and `import` statements go through CORS, and local files have no origin that can pass it. Modules written inline can't import one another either.

## Decision

The runtime, the block views and the adapters are built as classic scripts in IIFE form and inlined in the exported HTML. Each one registers itself on a single global (`AddonDeck.register(plugin)`). Packages are still written as ES modules; only the shipped browser artifacts are classic scripts.

## Consequences

- Exported decks work with a double click in every browser, with no server.
- Plugins can't import each other at runtime: they communicate through the registry and the services the runtime provides.
- The build produces two kinds of output, ESM for tooling and IIFE for the browser, and the exporter concatenates only the scripts a deck uses.
- One global name is exposed in the page.
