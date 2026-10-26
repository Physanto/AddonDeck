// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SlideNode } from "./slide-node";
import type { SlideOptions } from "./slide-options";
import type { SourceLocation } from "./source-location";
import type { SpeakerNotes } from "./speaker-notes";

/** One slide of a deck. */
export interface Slide {
	/** Position of the slide in the deck, starting at 0. Skipped empty slides are not counted. */
	readonly index: number;
	/** Index of the section the slide belongs to, or `null` before the first section. */
	readonly section: number | null;
	readonly options: SlideOptions;
	/** Text and blocks, in order of appearance. */
	readonly content: readonly SlideNode[];
	readonly notes: SpeakerNotes | null;
	/** Location of the first line of the slide. */
	readonly location: SourceLocation;
}
