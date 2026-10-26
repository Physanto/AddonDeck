// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * A position in the deck text.
 *
 * Lines and columns start at 1. Columns count UTF-16 code units, as most editors do.
 */
export interface SourceLocation {
	readonly line: number;
	readonly column: number;
}
