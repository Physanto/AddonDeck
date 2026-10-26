// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const MAX_HEADING_INDENT = 3;
const CLOSING_SEQUENCE = /(^|\s+)#+$/;

/**
 * Reads the text of a Markdown level-1 heading (`# Title`), without an optional
 * closing sequence of `#`. Returns `null` for any other line or an empty heading.
 */
export function readLevelOneHeading(line: string): string | null {
	const rest = line.trimStart();
	if (line.length - rest.length > MAX_HEADING_INDENT) return null;
	if (!rest.startsWith("#")) return null;
	const after = rest.slice(1);
	if (after !== "" && after[0] !== " " && after[0] !== "\t") return null;
	const title = after.trim().replace(CLOSING_SEQUENCE, "").trim();
	return title === "" ? null : title;
}
