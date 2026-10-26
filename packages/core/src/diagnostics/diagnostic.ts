// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** How serious a diagnostic is. Errors block exporting; warnings and information don't. */
export type DiagnosticSeverity = "error" | "warning" | "info";

/** Values inserted in a diagnostic message, by placeholder name. */
export type DiagnosticParams = Readonly<Record<string, string | number>>;

/**
 * A problem or a remark about the deck text, attached to a position.
 *
 * The code never changes meaning, so tools and language models can rely on it.
 * The message is already rendered in the active language; `code` and `params`
 * are enough to render it again in another one.
 */
export interface Diagnostic {
	readonly severity: DiagnosticSeverity;
	/** Stable code, such as `W304`. Blocks use codes of their own. */
	readonly code: string;
	readonly line: number;
	readonly column: number;
	/** Human readable message, including the suggestion when there is one. */
	readonly message: string;
	/** Values the message was rendered with. */
	readonly params: DiagnosticParams;
	/** Replacement text the author probably meant, such as `sequence`. */
	readonly suggestion?: string;
}
