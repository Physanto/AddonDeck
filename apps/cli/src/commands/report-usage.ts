// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { CliEnvironment } from "../cli-environment";
import type { CommandName } from "../command-line/read-command-line";
import { EXIT_CODE, type ExitCode } from "../exit-code";
import { createUsageReport } from "../report/json-report";

/**
 * Reports a wrong command line, or a file that cannot be read or written: as
 * JSON on the standard output when `--json` was given, otherwise as text on
 * the error output.
 */
export function reportUsage(
	command: CommandName | null,
	json: boolean,
	message: string,
	environment: CliEnvironment,
): ExitCode {
	if (json) {
		environment.stdout(
			JSON.stringify(createUsageReport(command, message), null, 2),
		);
	} else {
		environment.stderr(message);
	}
	return EXIT_CODE.usage;
}
