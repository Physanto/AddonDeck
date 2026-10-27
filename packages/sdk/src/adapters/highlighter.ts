// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * A piece of highlighted code.
 *
 * @experimental Settled together with the highlighter adapter; it may change until then.
 */
export interface HighlightToken {
	readonly text: string;
	/**
	 * Syntax category, such as `keyword`, `string` or `comment`, which the block
	 * maps to a theme variable; `null` for plain text.
	 */
	readonly scope: string | null;
}

/**
 * One line of highlighted code.
 *
 * @experimental Settled together with the highlighter adapter; it may change until then.
 */
export type HighlightedLine = readonly HighlightToken[];

/**
 * Splits code into highlighted tokens with a syntax highlighting library.
 *
 * It returns tokens instead of HTML so blocks keep control of their markup and
 * colors come from the theme.
 *
 * @experimental Settled together with the highlighter adapter; it may change until then.
 */
export interface Highlighter {
	/** Whether the language is known, by name or alias, such as `python` or `py`. */
	supports(language: string): boolean;
	/** One entry per line of `code`. Unknown languages come back as plain text. */
	highlight(code: string, language: string): readonly HighlightedLine[];
}
