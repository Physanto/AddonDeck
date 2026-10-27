// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { EASINGS } from "@addondeck/sdk";
import { eases } from "animejs";
import { describe, expect, it } from "vitest";
import { ANIME_EASINGS } from "./anime-easings";

describe("ANIME_EASINGS", () => {
	it("translates exactly the project easings", () => {
		expect(Object.keys(ANIME_EASINGS).sort()).toEqual([...EASINGS].sort());
	});

	it("names curves that anime.js has", () => {
		// anime.js silently plays an unknown name without easing.
		for (const name of Object.values(ANIME_EASINGS)) {
			expect((eases as Record<string, unknown>)[name], name).toBeTypeOf(
				"function",
			);
		}
	});
});
