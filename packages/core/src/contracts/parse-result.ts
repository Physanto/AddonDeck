// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "../diagnostics/diagnostic";

/**
 * What a block definition returns after reading its source.
 *
 * Parsing never throws: problems are reported as diagnostics, and the model is
 * the best the block could build from what was written.
 */
export interface ParseResult<M> {
	/** The block's model, or `null` when nothing usable could be read; the block is then shown as text. */
	readonly model: M | null;
	readonly diagnostics: readonly Diagnostic[];
}
