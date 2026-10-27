// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "./diagnostic";

/** Sorts diagnostics by line and column. Diagnostics at the same position keep their order. */
export function sortByPosition(
	diagnostics: readonly Diagnostic[],
): readonly Diagnostic[] {
	return [...diagnostics].sort(
		(a, b) => a.line - b.line || a.column - b.column,
	);
}
