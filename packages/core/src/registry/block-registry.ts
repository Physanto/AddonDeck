// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";

/** The installed blocks the parser can recognize, by every keyword they answer to. */
export interface BlockRegistry {
	/**
	 * Finds the block a keyword names, comparing after normalization.
	 *
	 * @returns The block definition, or `undefined` when no installed block uses the keyword.
	 */
	resolve(keyword: string): BlockDefinition | undefined;
	/** Every normalized type and alias, in registration order. Used for suggestions. */
	readonly keywords: readonly string[];
}
