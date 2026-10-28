# @addondeck/exporter

Builds the single-file HTML export of a deck.

`exportDeck` turns `.deck` text into one `index.html` that opens with a double click: the deck text, the runtime, and only the blocks, adapters, styles and assets the deck uses. It runs in the browser and in Node.js, so it never touches the DOM or the file system: everything it reads comes through the `io` it receives.

```ts
import { createBlockRegistry } from "@addondeck/core";
import { exportDeck } from "@addondeck/exporter";

const result = await exportDeck(
	text,
	{ registry: createBlockRegistry([text, list, image]) },
	{ artifacts, assets },
);
if (result.ok) await save("index.html", result.html);
else
	for (const diagnostic of result.diagnostics)
		console.error(diagnostic.message);
```

- `options.registry` holds the block definitions the deck is parsed with. Their `needs` decide the adapters included and their `assets(model)` the assets embedded.
- `options.force` exports even with errors; without the runtime nothing can be exported.
- `io.artifacts` (`ArtifactSource`) reads the compiled files of each package of artifacts (`@addondeck/runtime`, `@addondeck/blocks`, `@addondeck/adapters`…). Each package has a `manifest.json` that lists its pieces; when two packages offer the same piece, the first one listed wins.
- `io.assets` (`AssetResolver`) returns the bytes of each asset reference, such as `image:team.jpg`, or `null`.

The result always has the diagnostics of the deck text followed by those of the export, and the analysis of what the deck uses. Saving the page is up to the caller.

## Pipeline

Each stage lives in its own file under `src/pipeline/`:

| Stage   | What it does                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| parse   | Parses the text with the registry. Errors stop the export here, unless forced.                                                                                      |
| analyze | Lists the blocks drawn (`text` when there is text), the adapters (the animator unless the motion is `minimal`, plus the blocks' `needs`), the theme and the assets. |
| collect | Reads the manifests, scripts and styles of those pieces, and resolves the assets, keeping each distinct file once by its SHA-256 hash (Web Crypto).                 |
| inline  | Escapes every part so that none can close its element, and puts them in page order.                                                                                 |
| emit    | Writes the page, with `lang` and `<title>` from the deck header and `<meta name="generator">` with the runtime version.                                             |

The page, the manifest and the escaping are described in [the exported page](../../docs/format/exported-page.md).

## Diagnostics

| Code         | Severity | Means                                                                      |
| ------------ | -------- | -------------------------------------------------------------------------- |
| `EXPORT-E01` | error    | No runtime script was found; nothing is exported, even when forced.        |
| `EXPORT-E02` | error    | A package of artifacts has no `manifest.json`, or it cannot be read.       |
| `EXPORT-E03` | error    | A block the deck uses has no script.                                       |
| `EXPORT-E04` | error    | An adapter the deck needs has no script.                                   |
| `EXPORT-E05` | error    | A file a manifest lists cannot be read; its piece is left out when forced. |
| `EXPORT-W01` | warning  | An asset was not found; the exported deck shows a frame in its place.      |
| `EXPORT-W02` | warning  | A block failed to list its assets, so none are embedded for it.            |

Problems that are not in the deck text have line and column 0. Messages come from the exporter's text catalog (`EN_EXPORT_MESSAGES`); `options.messages` replaces them for another language.

> Status: single HTML export is in place; the zip export comes later. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
