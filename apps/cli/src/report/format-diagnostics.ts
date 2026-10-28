// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "@addondeck/core";
import type { Translate } from "../messages/create-translator";
import { summarize } from "./json-report";

/**
 * One line per problem, as compilers print them: `talk.deck:3:5: warning
 * W304: …`. Problems that are not in the text carry only the file name.
 */
export function formatDiagnostics(
	file: string,
	diagnostics: readonly Diagnostic[],
	translate: Translate,
): string[] {
	return diagnostics.map((diagnostic) =>
		translate("diagnostic", {
			location:
				diagnostic.line === 0
					? file
					: `${file}:${diagnostic.line}:${diagnostic.column}`,
			severity: translate(diagnostic.severity),
			code: diagnostic.code,
			message: diagnostic.message,
		}),
	);
}

/** The closing line: how many errors and warnings, or that there are none. */
export function formatSummary(
	file: string,
	diagnostics: readonly Diagnostic[],
	translate: Translate,
): string {
	const { errors, warnings } = summarize(diagnostics);
	if (errors === 0 && warnings === 0) return translate("noProblems", { file });
	return translate("summary", {
		file,
		errors: translate(errors === 1 ? "oneError" : "errors", { count: errors }),
		warnings: translate(warnings === 1 ? "oneWarning" : "warnings", {
			count: warnings,
		}),
	});
}
