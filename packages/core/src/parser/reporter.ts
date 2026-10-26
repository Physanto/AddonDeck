// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { createDiagnostic } from "../diagnostics/create-diagnostic";
import type { Diagnostic } from "../diagnostics/diagnostic";
import type {
	DiagnosticCode,
	DiagnosticParamsOf,
} from "../diagnostics/diagnostic-codes";
import type { PartialDiagnosticMessages } from "../diagnostics/diagnostic-messages";
import type { SourceLocation } from "../model/source-location";

/** Collects the diagnostics of one parse, rendered in the active language. */
export interface Reporter {
	readonly diagnostics: readonly Diagnostic[];
	readonly messages: PartialDiagnosticMessages | undefined;
	report<C extends DiagnosticCode>(
		code: C,
		location: SourceLocation,
		params: DiagnosticParamsOf<C>,
		suggestion?: string | null,
	): void;
	add(diagnostics: readonly Diagnostic[]): void;
}

export function createReporter(
	messages: PartialDiagnosticMessages | undefined,
): Reporter {
	const diagnostics: Diagnostic[] = [];
	return {
		diagnostics,
		messages,
		report(code, location, params, suggestion) {
			diagnostics.push(
				createDiagnostic(code, location, params, {
					...(suggestion == null ? {} : { suggestion }),
					...(messages === undefined ? {} : { messages }),
				}),
			);
		},
		add(more) {
			diagnostics.push(...more);
		},
	};
}
