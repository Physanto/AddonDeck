// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "../model/source-location";

/** A `→ id` of one step. */
export interface StepTrigger {
	/** Normalized id of the block that advances in the same click. */
	readonly id: string;
	readonly location: SourceLocation;
	/**
	 * Whether a missing target is reported as `E204` here. The parser already
	 * reports the triggers of text lines.
	 */
	readonly reportUnknown: boolean;
}

/** One step of a piece of slide content, ready to be placed in a click. */
export interface ParticipantStep {
	/** Click requested with `@n`, or `null` for the default order. */
	readonly at: number | null;
	readonly triggers: readonly StepTrigger[];
	readonly location: SourceLocation;
}

/** A text or a block of the slide that offers steps. */
export interface Participant {
	/** Index of the node in `slide.content`. */
	readonly node: number;
	/** Id of the block, so arrows can name it; `null` for text and blocks without id. */
	readonly id: string | null;
	readonly steps: readonly ParticipantStep[];
}
