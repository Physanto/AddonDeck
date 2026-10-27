// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ThemeTokens } from "@addondeck/sdk";
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "./default-tokens";
import { resolveTheme } from "./resolve-theme";

const PLAIN = { theme: "paper", color: null, accent: null, font: null };

describe("resolveTheme", () => {
	it("gives the installed theme the deck names", () => {
		expect(resolveTheme(PLAIN)).toEqual(DEFAULT_THEME_TOKENS);
	});

	it("falls back to paper for a theme that is not installed", () => {
		expect(resolveTheme({ ...PLAIN, theme: "neon" }).id).toBe("paper");
	});

	it("takes the themes to choose from", () => {
		const ocean: ThemeTokens = { ...DEFAULT_THEME_TOKENS, id: "ocean" };
		const themes = new Map([["ocean", ocean]]);
		expect(resolveTheme({ ...PLAIN, theme: "ocean" }, themes)).toEqual(ocean);
	});

	it("writes the header's color and accent over the theme's", () => {
		const theme = resolveTheme({ ...PLAIN, color: "#0a7", accent: "gold" });
		expect(theme.colors).toEqual({
			...DEFAULT_THEME_TOKENS.colors,
			primary: "#0a7",
			accent: "gold",
		});
	});

	it("puts the header's font first, keeping the theme's as fallbacks", () => {
		const { fonts } = resolveTheme({ ...PLAIN, font: "Space Grotesk" });
		expect(fonts).toEqual({
			heading: "Space Grotesk, system-ui, sans-serif",
			body: "Space Grotesk, system-ui, sans-serif",
			code: DEFAULT_THEME_TOKENS.fonts.code,
		});
	});
});
