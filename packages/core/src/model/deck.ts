// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta, HeaderEntry } from "./deck-meta";
import type { Section } from "./section";
import type { Slide } from "./slide";

/**
 * A parsed deck: the document model produced from `.deck` text.
 *
 * The model is plain, immutable data, so it can be serialized, compared in
 * tests and sent between windows.
 */
export interface Deck {
	/** Settings with defaults applied. */
	readonly meta: DeckMeta;
	/** Header lines as written, in order. */
	readonly header: readonly HeaderEntry[];
	readonly sections: readonly Section[];
	readonly slides: readonly Slide[];
}
