// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { MotionTokens, ThemeTokens } from "@addondeck/sdk";

/** The `paper` theme: the default one, and the one used for unknown names. */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
	id: "paper",
	colors: {
		bg: "#fbfaf7",
		surface: "#f0eee8",
		text: "#1c1b19",
		muted: "#6b675f",
		primary: "#2f5bd3",
		accent: "#d9622b",
		good: "#2e8540",
		bad: "#c0392b",
	},
	fonts: {
		heading: "system-ui, sans-serif",
		body: "system-ui, sans-serif",
		code: "ui-monospace, monospace",
	},
	radius: 12,
};

/**
 * The `smooth` personality: the default one, also used for the personalities
 * that are not installed.
 */
export const DEFAULT_MOTION_TOKENS: MotionTokens = {
	id: "smooth",
	duration: { xs: 150, s: 300, m: 600, l: 1000 },
	easing: { enter: "outCubic", exit: "inCubic", move: "inOutQuad" },
	stagger: 80,
	overshoot: 0,
};

/**
 * The `minimal` personality, used whenever the system asks for reduced
 * motion. Everything changes at once.
 */
export const MINIMAL_MOTION_TOKENS: MotionTokens = {
	id: "minimal",
	duration: { xs: 0, s: 0, m: 0, l: 0 },
	easing: { enter: "linear", exit: "linear", move: "linear" },
	stagger: 0,
	overshoot: 0,
};
