// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind, SourceLocation } from "@addondeck/core";

/** An asset reference and where the deck first uses it. */
export interface AssetUse {
	readonly reference: string;
	readonly location: SourceLocation;
}

/** What a deck uses, and so what its exported page includes. */
export interface DeckAnalysis {
	/** Types of the blocks drawn, sorted; `text` when the deck has text. */
	readonly blocks: readonly string[];
	/** Adapters the deck needs, sorted. */
	readonly adapters: readonly AdapterKind[];
	readonly theme: string;
	/** Asset references, once each, in order of first use. */
	readonly assets: readonly AssetUse[];
}
