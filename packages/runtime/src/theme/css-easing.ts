// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Easing } from "@addondeck/sdk";

/**
 * Each easing as a CSS timing function, for what the runtime moves with CSS
 * transitions, such as slides.
 *
 * Elastic and bounce curves need several segments that `cubic-bezier` cannot
 * describe, so they become the closest curve that overshoots.
 */
export const CSS_EASINGS: Readonly<Record<Easing, string>> = {
	linear: "linear",
	inQuad: "cubic-bezier(0.11, 0, 0.5, 0)",
	outQuad: "cubic-bezier(0.5, 1, 0.89, 1)",
	inOutQuad: "cubic-bezier(0.45, 0, 0.55, 1)",
	inCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
	outCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
	inOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",
	inBack: "cubic-bezier(0.36, 0, 0.66, -0.56)",
	outBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
	inOutBack: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
	outElastic: "cubic-bezier(0.34, 1.56, 0.64, 1)",
	outBounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};
