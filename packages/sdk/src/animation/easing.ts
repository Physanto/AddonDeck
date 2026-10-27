// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Easing curves every animator supports, named independently of any animation
 * library; each adapter maps them to its own.
 */
export const EASINGS = [
	"linear",
	"inQuad",
	"outQuad",
	"inOutQuad",
	"inCubic",
	"outCubic",
	"inOutCubic",
	"inBack",
	"outBack",
	"inOutBack",
	"outElastic",
	"outBounce",
] as const;

/** An easing curve from {@link EASINGS}. */
export type Easing = (typeof EASINGS)[number];
