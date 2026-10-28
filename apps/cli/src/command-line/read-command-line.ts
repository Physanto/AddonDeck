// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { parseArgs } from "node:util";
import type { DiagnosticParams } from "@addondeck/core";
import type { CliMessageKey } from "../messages/cli-messages";

/** The commands `addondeck` understands. */
export type CommandName = "check" | "build";

/** What the command line asks for. */
export type CommandLine =
	| { readonly kind: "help" }
	| { readonly kind: "check"; readonly file: string; readonly json: boolean }
	| {
			readonly kind: "build";
			readonly file: string;
			/** `null` writes `<name>.html` next to the deck. */
			readonly output: string | null;
			readonly watermark: boolean;
			readonly force: boolean;
	  }
	| {
			readonly kind: "usage";
			readonly command: CommandName | null;
			/** Whether `--json` was given, so the problem is reported as JSON. */
			readonly json: boolean;
			readonly message: CliMessageKey;
			readonly params: DiagnosticParams;
	  };

type OptionName = "help" | "json" | "output" | "no-watermark" | "force";

const OPTIONS = {
	help: { type: "boolean", short: "h" },
	json: { type: "boolean" },
	output: { type: "string", short: "o" },
	"no-watermark": { type: "boolean" },
	force: { type: "boolean" },
} as const;

const COMMAND_OPTIONS: Readonly<Record<CommandName, readonly OptionName[]>> = {
	check: ["help", "json"],
	build: ["help", "output", "no-watermark", "force"],
};

function isCommand(name: string): name is CommandName {
	return Object.hasOwn(COMMAND_OPTIONS, name);
}

/**
 * Reads the arguments given to `addondeck`, without the program name.
 *
 * Every problem becomes a `usage` result with a message of the text catalog,
 * so none of them reaches the user in the wording of Node.js.
 */
export function readCommandLine(args: readonly string[]): CommandLine {
	// Not strict: unknown options and missing values come back as tokens, and
	// are reported here with translatable messages.
	const { tokens } = parseArgs({
		args: [...args],
		options: OPTIONS,
		strict: false,
		allowPositionals: true,
		tokens: true,
	});
	const positionals: string[] = [];
	const given = new Map<string, string | undefined>();
	let unknown: string | null = null;
	let json = false;
	for (const token of tokens) {
		if (token.kind === "positional") positionals.push(token.value);
		if (token.kind !== "option") continue;
		if (token.name === "json") json = true;
		if (Object.hasOwn(OPTIONS, token.name)) {
			given.set(token.name, token.rawName);
		} else {
			unknown ??= token.rawName;
		}
	}
	const [name, file, extra] = positionals;
	const command = name !== undefined && isCommand(name) ? name : null;
	const usage = (
		message: CliMessageKey,
		params: DiagnosticParams = {},
	): CommandLine => ({ kind: "usage", command, json, message, params });

	if (given.has("help")) return { kind: "help" };
	if (name === undefined) return usage("missingCommand");
	if (command === null) return usage("unknownCommand", { command: name });
	if (unknown !== null)
		return usage("unknownOption", { command, option: unknown });
	for (const [option, rawName] of given) {
		if (!COMMAND_OPTIONS[command].includes(option as OptionName)) {
			return usage("unknownOption", { command, option: rawName ?? option });
		}
	}
	for (const token of tokens) {
		if (token.kind !== "option") continue;
		if (token.name === "output") {
			// `-o --force` would otherwise name the page "--force".
			if (
				token.value === undefined ||
				token.value === "" ||
				(!token.inlineValue && token.value.startsWith("-"))
			) {
				return usage("missingValue", { option: token.rawName });
			}
		} else if (token.value !== undefined) {
			return usage("unexpectedValue", { option: token.rawName });
		}
	}
	if (file === undefined) return usage("missingFile", { command });
	if (extra !== undefined) {
		return usage("extraArgument", { command, argument: extra });
	}

	if (command === "check") return { kind: "check", file, json };
	let output: string | null = null;
	for (const token of tokens) {
		if (token.kind === "option" && token.name === "output") {
			output = token.value ?? null;
		}
	}
	return {
		kind: "build",
		file,
		output,
		watermark: !given.has("no-watermark"),
		force: given.has("force"),
	};
}
