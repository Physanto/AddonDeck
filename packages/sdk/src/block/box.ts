// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** A rectangle in stage pixels, measured from the top left corner of the stage. */
export interface Box {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}
