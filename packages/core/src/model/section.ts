// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "./source-location";

/** A named group of consecutive slides, started by a `section:` directive. */
export interface Section {
	/** Position of the section in the deck, starting at 0. */
	readonly index: number;
	readonly title: string;
	/** Index of the first slide of the section. */
	readonly firstSlide: number;
	/** Location of the `section:` directive. */
	readonly location: SourceLocation;
}
