// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Diagnostic,
	type DiagnosticParams,
	type DiagnosticSeverity,
	formatMessage,
	type SourceLocation,
} from "@addondeck/core";

/** A diagnostic a block can report: how serious it is and its English message. */
export interface BlockMessage {
	readonly severity: DiagnosticSeverity;
	/** Template with `{name}` placeholders for the parameters. */
	readonly message: string;
}

/**
 * The diagnostics of a block, by code. Codes are `<TYPE>-<letter><number>`,
 * such as `IMAGE-W01`, with the letter of the severity: `E`, `W` or `I`.
 */
export type BlockMessages<C extends string = string> = Readonly<
	Record<C, BlockMessage>
>;

/**
 * Creates a diagnostic of a block from its message catalog.
 *
 * @example
 * ```ts
 * const MESSAGES = {
 *   "IMAGE-W01": { severity: "warning", message: "The image has no alt text." },
 * } satisfies BlockMessages;
 * createBlockDiagnostic(MESSAGES, "IMAGE-W01", source.location);
 * ```
 */
export function createBlockDiagnostic<C extends string>(
	messages: BlockMessages<C>,
	code: C,
	location: SourceLocation,
	params: DiagnosticParams = {},
): Diagnostic {
	const { severity, message } = messages[code];
	return {
		severity,
		code,
		line: location.line,
		column: location.column,
		message: formatMessage(message, params),
		params,
	};
}
