// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "../model/source-location";
import type { Diagnostic } from "./diagnostic";
import {
	DIAGNOSTIC_CODES,
	type DiagnosticCode,
	type DiagnosticParamsOf,
} from "./diagnostic-codes";
import type {
	DiagnosticMessageKey,
	PartialDiagnosticMessages,
} from "./diagnostic-messages";
import { formatMessage } from "./format-message";
import { EN_DIAGNOSTIC_MESSAGES } from "./messages-en";

/** Optional parts of a diagnostic. */
export interface CreateDiagnosticOptions {
	/** Replacement text the author probably meant; it is added to the message. */
	readonly suggestion?: string;
	/** Messages of the active language. Missing ones fall back to English. */
	readonly messages?: PartialDiagnosticMessages;
}

/**
 * Creates a format diagnostic with its severity and a rendered message.
 *
 * @param code - A code from {@link DIAGNOSTIC_CODES}.
 * @param location - Where the problem is.
 * @param params - The values the code's message needs.
 * @param options - Suggestion and message catalog.
 * @returns A diagnostic ready to show.
 *
 * @example
 * ```ts
 * createDiagnostic("W304", { line: 7, column: 1 }, { keyword: "secuence" }, { suggestion: "sequence" });
 * // message: 'Unknown block "secuence"; it is shown as text. Did you mean "sequence"?'
 * ```
 */
export function createDiagnostic<C extends DiagnosticCode>(
	code: C,
	location: SourceLocation,
	params: DiagnosticParamsOf<C>,
	options: CreateDiagnosticOptions = {},
): Diagnostic {
	const message = (key: DiagnosticMessageKey): string =>
		options.messages?.[key] ?? EN_DIAGNOSTIC_MESSAGES[key];

	let text = formatMessage(message(code), params);
	if (options.suggestion !== undefined) {
		text = `${text} ${formatMessage(message("didYouMean"), { suggestion: options.suggestion })}`;
	}

	const diagnostic: Diagnostic = {
		severity: DIAGNOSTIC_CODES[code].severity,
		code,
		line: location.line,
		column: location.column,
		message: text,
		params,
	};
	return options.suggestion === undefined
		? diagnostic
		: { ...diagnostic, suggestion: options.suggestion };
}
