# @addondeck/cli

The `addondeck` command: checks a deck and exports it to a single HTML file that opens with a double click. It reuses the parser and the exporter instead of reimplementing them.

```sh
addondeck check talk.deck            # list the problems of a deck
addondeck check talk.deck --json     # the same, as JSON for tools and agents
addondeck build talk.deck            # write talk.html next to the deck
addondeck build talk.deck -o site/index.html --no-watermark
```

## Commands

| Command                       | Options                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `addondeck check <file.deck>` | `--json`: print the result as JSON                                                       |
| `addondeck build <file.deck>` | `-o, --output <file>`: where to write the page (default: `<name>.html` next to the deck) |
|                               | `--no-watermark`: leave out the "Made with AddonDeck" badge                              |
|                               | `--force`: export even when the deck has errors                                          |
| `addondeck --help`            | Show the help; `-h` too                                                                  |

`check` runs the same export as `build` without writing anything, so it reports every problem `build` would: those of the deck text (parser, blocks and step plans) followed by those of the export, such as an image that is not found.

`build` prints the problems on the error output and the line naming the page on the standard output. With errors it writes nothing, unless `--force` is given. It never writes the page over the deck itself.

`--no-watermark` keeps the deck text as written: the page asks the runtime to hide the badge ([the exported page](../../docs/format/exported-page.md)).

## Exit codes

| Code | Means                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------- |
| `0`  | Done. The deck may have warnings.                                                                    |
| `1`  | The deck has errors, or it cannot be exported (also after writing it with `--force`).                |
| `2`  | Wrong usage: unknown command or option, missing file name, or a file that cannot be read or written. |

## JSON output

`addondeck check <file> --json` prints one JSON object on the standard output. Fields are only ever added within a `schema` version; removing or changing one starts a new version.

```json
{
	"schema": 1,
	"command": "check",
	"file": "talk.deck",
	"ok": false,
	"summary": { "errors": 1, "warnings": 1, "info": 0 },
	"diagnostics": [
		{
			"severity": "error",
			"code": "E101",
			"line": 1,
			"column": 9,
			"message": "This deck uses format 9, but only format 1 is supported. It is read as format 1.",
			"params": { "version": "9", "supported": 1 }
		},
		{
			"severity": "warning",
			"code": "W304",
			"line": 5,
			"column": 1,
			"message": "Unknown block \"lsit\"; it is shown as text. Did you mean \"list\"?",
			"params": { "keyword": "lsit" },
			"suggestion": "list"
		}
	]
}
```

| Field            | Meaning                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`         | Version of this format, `1`.                                                                                                                                                                                                    |
| `command`        | `"check"`.                                                                                                                                                                                                                      |
| `file`           | The deck file, as given on the command line.                                                                                                                                                                                    |
| `ok`             | `true` when there are no errors; warnings do not count. Matches exit code `0`.                                                                                                                                                  |
| `summary`        | How many diagnostics of each severity.                                                                                                                                                                                          |
| `diagnostics`    | Problems of the deck text first, then those of the export.                                                                                                                                                                      |
| `severity`       | `error`, `warning` or `info`.                                                                                                                                                                                                   |
| `code`           | Stable code: parser codes such as `W304` ([format](../../docs/format/v1.md)), block codes such as `LIST-W03` (each block's `docs.md`), and exporter codes such as `EXPORT-W01` ([exporter](../../packages/exporter/README.md)). |
| `line`, `column` | 1-based position in the deck text; both are `0` for problems that are not in the text, such as a missing artifact.                                                                                                              |
| `message`        | The problem, in the active language.                                                                                                                                                                                            |
| `params`         | The values the message was rendered with; with `code`, enough to word it in another language.                                                                                                                                   |
| `suggestion`     | Present when there is a likely replacement, such as the block name the author probably meant.                                                                                                                                   |

When the command line is wrong and `--json` was given, the object is instead:

```json
{
	"schema": 1,
	"command": "check",
	"ok": false,
	"usage": "The file talk.deck does not exist."
}
```

`command` is `null` when the command itself is missing or unknown. The exit code is then `2`.

## Images

A reference such as `image team.png:` is looked up relative to the deck's folder, then in its `assets/` folder. Only images (PNG, JPEG, GIF, WebP, AVIF, SVG) and videos (MP4, WebM) are read, and never from outside the deck's folder, symbolic links included, so a deck from elsewhere cannot embed other files of the computer in its page. Anything else, including web addresses and catalog references for now, is reported as not found (`EXPORT-W01`). Exported pages show images with `<img>`, where an SVG cannot run scripts.

## As a library

`run(args, environment)` runs the command with injected output, which is how the tests drive it; it returns the exit code. The package also exports the Node.js implementations of the exporter's inputs: `createNodeArtifactSource` reads the compiled scripts of the installed `@addondeck/runtime`, `@addondeck/blocks` and `@addondeck/adapters` (each exports its `manifest.json`), and `createLocalAssetResolver` reads the images of a deck's folder.

Every text comes from the command line catalog (`EN_CLI_MESSAGES`); `environment.messages`, `exportMessages` and `diagnosticMessages` replace them for another language.

> Status: `check` and `build` are in place; `new`, `dev`, `prompt` and `blocks` come later. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
