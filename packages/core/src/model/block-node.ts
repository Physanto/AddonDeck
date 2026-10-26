// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockSource } from "../contracts/block-source";

/** A block of a slide, as written and as its definition read it. */
export interface BlockNode extends BlockSource {
	readonly kind: "block";
	/** What the block definition's `parse` returned as its model. */
	readonly model: unknown;
}
