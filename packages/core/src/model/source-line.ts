// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * One line of deck text, kept exactly as written.
 *
 * Block bodies and notes are passed as lists of source lines so that blocks can
 * report diagnostics on the right line and read the text with or without its indentation.
 */
export interface SourceLine {
	/** Line number in the deck, starting at 1. */
	readonly line: number;
	/** The line as written, without its line ending. */
	readonly raw: string;
	/**
	 * The line without the base indentation of the body it belongs to.
	 * Equal to {@link SourceLine.raw} outside block bodies and notes.
	 */
	readonly text: string;
}
