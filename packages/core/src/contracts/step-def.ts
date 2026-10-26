// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "../model/source-location";

/**
 * One step a block offers to its slide: what happens on one click.
 *
 * Steps without `at` are played in order of appearance; `at` and
 * `triggers` come from step annotations (`@n` and `→ id`).
 */
export interface StepDef {
	/** Slide step this step is pinned to with `@n`, or `null` to follow the default order. */
	readonly at: number | null;
	/** Normalized ids of blocks that advance in the same click. */
	readonly triggers: readonly string[];
	/** Where the step is defined, for diagnostics; `null` when it has no single line. */
	readonly location: SourceLocation | null;
}
