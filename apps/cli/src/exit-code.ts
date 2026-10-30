// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * How `addondeck` ends. Scripts and agents rely on these, so they never
 * change meaning.
 */
export const EXIT_CODE = {
	/** Done; the deck may have warnings. */
	ok: 0,
	/** The deck has errors, or it could not be exported. */
	deckErrors: 1,
	/** The command line is wrong, or a file cannot be read or written. */
	usage: 2,
} as const;

export type ExitCode = (typeof EXIT_CODE)[keyof typeof EXIT_CODE];
