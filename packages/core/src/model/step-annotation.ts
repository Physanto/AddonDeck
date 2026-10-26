// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "./source-location";

/**
 * A step annotation found at the end of a line: `@n`, `→ id`, or both.
 *
 * @example
 * The annotation of `print("Paid!")    @3 → network` is
 * `{ step: 3, triggers: ["network"], location: … }`.
 */
export interface StepAnnotation {
	/** The slide step the line belongs to, or `null` when the annotation only has triggers. */
	readonly step: number | null;
	/** Normalized ids of the blocks that advance in the same step, in order. */
	readonly triggers: readonly string[];
	/** Where the annotation starts in the line. */
	readonly location: SourceLocation;
}
