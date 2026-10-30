// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { CliMessages } from "./cli-messages";

/** English command line messages, the fallback for every other language. */
export const EN_CLI_MESSAGES: CliMessages = {
	help: `Usage: addondeck <command> <file.deck> [options]

Commands:
  check <file.deck>      Show the problems of a deck
  build <file.deck>      Export a deck to a single HTML file

Options of check:
  --json                 Print the result as JSON, for tools and agents

Options of build:
  -o, --output <file>    Where to write the page (default: <name>.html next to the deck)
  --no-watermark         Leave out the "Made with AddonDeck" badge
  --force                Export even when the deck has errors

  -h, --help             Show this help

Exit codes: 0 done, 1 the deck has errors, 2 wrong usage.`,
	missingCommand:
		'Tell addondeck what to do: check or build. Run "addondeck --help" for details.',
	unknownCommand:
		'Unknown command "{command}". Run "addondeck --help" to see the commands.',
	missingFile:
		'The {command} command needs a .deck file, as in "addondeck {command} talk.deck".',
	extraArgument:
		'Unexpected argument "{argument}": {command} takes a single .deck file.',
	unknownOption:
		'The {command} command has no option {option}. Run "addondeck --help" to see the options.',
	missingValue:
		'The option {option} needs a file name, as in "{option} talk.html".',
	unexpectedValue: "The option {option} takes no value.",
	fileNotFound: "The file {file} does not exist.",
	unreadableFile: "The file {file} cannot be read ({reason}).",
	outputIsInput:
		"The page would replace the deck {file}; choose another name with -o.",
	unwritableOutput: "The page cannot be written to {file} ({reason}).",
	error: "error",
	warning: "warning",
	info: "info",
	diagnostic: "{location}: {severity} {code}: {message}",
	noProblems: "{file}: no problems found.",
	oneError: "1 error",
	errors: "{count} errors",
	oneWarning: "1 warning",
	warnings: "{count} warnings",
	summary: "{file}: {errors} and {warnings}.",
	wrote: "Wrote {file} ({size} KB).",
	wroteDespiteErrors:
		"Wrote {file} ({size} KB) despite the errors, because of --force.",
	notWritten:
		"Nothing was written: fix the errors above, or export anyway with --force.",
};
