// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { MotionTokens } from "../services/motion-tokens";
import type { StageInfo } from "../services/stage-info";
import type { ThemeTokens } from "../services/theme-tokens";

/** Theme of {@link createTestContext}: plain values, easy to recognize in snapshots. */
export const TEST_THEME_TOKENS: ThemeTokens = {
	id: "test",
	colors: {
		bg: "#ffffff",
		surface: "#f2f2f2",
		text: "#111111",
		muted: "#666666",
		primary: "#0057b8",
		accent: "#c2410c",
		good: "#15803d",
		bad: "#b91c1c",
	},
	fonts: { heading: "serif", body: "sans-serif", code: "monospace" },
	radius: 8,
};

/** Motion of {@link createTestContext}. */
export const TEST_MOTION_TOKENS: MotionTokens = {
	id: "test",
	duration: { xs: 100, s: 200, m: 400, l: 800 },
	easing: { enter: "outCubic", exit: "inCubic", move: "inOutQuad" },
	stagger: 50,
	overshoot: 0,
};

/** Stage of {@link createTestContext}: the default 1920×1080, unscaled. */
export const TEST_STAGE_INFO: StageInfo = {
	width: 1920,
	height: 1080,
	scale: 1,
};
