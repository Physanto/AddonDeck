// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "./source-line";
import type { SourceLocation } from "./source-location";

/** Speaker notes of a slide, shown only in presenter mode. */
export interface SpeakerNotes {
	/** Every notes line of the slide, without the base indentation, in order. */
	readonly lines: readonly SourceLine[];
	/** The notes as one text; separate `notes:` sections are joined by a blank line. */
	readonly text: string;
	/** Location of the first `notes:` line. */
	readonly location: SourceLocation;
}
