// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "./source-line";
import type { SourceLocation } from "./source-location";

/**
 * Consecutive Markdown lines of a slide, rendered by the implicit `text` block.
 * Comments are already removed, and so are blank lines at the start and the end.
 */
export interface TextNode {
	readonly kind: "text";
	readonly lines: readonly SourceLine[];
	/** Location of the first line. */
	readonly location: SourceLocation;
}
