// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Keyword of the directive that starts a section. */
export const SECTION_KEYWORD = "section";

/** Keyword of the directive that sets slide options. */
export const SLIDE_KEYWORD = "slide";

/** Keyword that starts speaker notes. */
export const NOTES_KEYWORD = "notes";

/**
 * Keywords the format itself uses inside slides. No block may take them as its
 * type or alias, or a line could mean two things.
 */
export const STRUCTURE_KEYWORDS: readonly string[] = [
	SECTION_KEYWORD,
	SLIDE_KEYWORD,
	NOTES_KEYWORD,
];
