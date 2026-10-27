// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { EASINGS } from "@addondeck/sdk";
import { describe, expect, it } from "vitest";
import { CSS_EASINGS } from "./css-easing";
import { DEFAULT_MOTION_TOKENS, DEFAULT_THEME_TOKENS } from "./default-tokens";
import { themeVariables } from "./theme-variables";

describe("themeVariables", () => {
	it("turns the theme and the motion into CSS variables", () => {
		expect(
			Object.fromEntries(
				themeVariables(DEFAULT_THEME_TOKENS, DEFAULT_MOTION_TOKENS),
			),
		).toEqual({
			"--color-bg": "#fbfaf7",
			"--color-surface": "#f0eee8",
			"--color-text": "#1c1b19",
			"--color-muted": "#6b675f",
			"--color-primary": "#2f5bd3",
			"--color-accent": "#d9622b",
			"--color-good": "#2e8540",
			"--color-bad": "#c0392b",
			"--font-heading": "system-ui, sans-serif",
			"--font-body": "system-ui, sans-serif",
			"--font-code": "ui-monospace, monospace",
			"--radius": "12px",
			"--adk-duration-xs": "150ms",
			"--adk-duration-s": "300ms",
			"--adk-duration-m": "600ms",
			"--adk-duration-l": "1000ms",
			"--adk-easing-enter": "cubic-bezier(0.33, 1, 0.68, 1)",
			"--adk-easing-exit": "cubic-bezier(0.32, 0, 0.67, 0)",
			"--adk-easing-move": "cubic-bezier(0.45, 0, 0.55, 1)",
		});
	});

	it("has a CSS timing function for every easing", () => {
		for (const easing of EASINGS) {
			expect(CSS_EASINGS[easing]).toMatch(/^(linear|cubic-bezier\(.+\))$/);
		}
	});
});
