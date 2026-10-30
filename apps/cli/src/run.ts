// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { CliEnvironment } from "./cli-environment";
import { readCommandLine } from "./command-line/read-command-line";
import { buildCommand } from "./commands/build-command";
import { checkCommand } from "./commands/check-command";
import { reportUsage } from "./commands/report-usage";
import { EXIT_CODE, type ExitCode } from "./exit-code";
import { createTranslator } from "./messages/create-translator";

/**
 * Runs `addondeck` with the arguments that follow the program name.
 *
 * @returns The exit code: 0 done, 1 the deck has errors, 2 wrong usage.
 *
 * @example
 * ```ts
 * const code = await run(["check", "talk.deck", "--json"], {
 * 	cwd: process.cwd(),
 * 	stdout: (line) => console.log(line),
 * 	stderr: (line) => console.error(line),
 * });
 * ```
 */
export async function run(
	args: readonly string[],
	environment: CliEnvironment,
): Promise<ExitCode> {
	const translate = createTranslator(environment.messages);
	const line = readCommandLine(args);
	switch (line.kind) {
		case "help":
			environment.stdout(translate("help"));
			return EXIT_CODE.ok;
		case "usage":
			return reportUsage(
				line.command,
				line.json,
				translate(line.message, line.params),
				environment,
			);
		case "check":
			return checkCommand(line.file, line.json, environment, translate);
		case "build":
			return buildCommand(line, environment, translate);
	}
}
