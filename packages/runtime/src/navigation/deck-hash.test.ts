// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { formatDeckHash, parseDeckHash } from "./deck-hash";

describe("parseDeckHash", () => {
	it("reads the slide and the step, both counted from 1", () => {
		expect(parseDeckHash("#/3/2")).toEqual({ slide: 2, step: 1 });
		expect(parseDeckHash("#/1/1")).toEqual({ slide: 0, step: 0 });
		expect(parseDeckHash("#/12/10")).toEqual({ slide: 11, step: 9 });
	});

	it("opens a slide at its start when the step is left out", () => {
		expect(parseDeckHash("#/3")).toEqual({ slide: 2, step: 0 });
		expect(parseDeckHash("#/3/")).toEqual({ slide: 2, step: 0 });
		expect(parseDeckHash("#/3/2/")).toEqual({ slide: 2, step: 1 });
	});

	it("ignores hashes that are not positions", () => {
		for (const hash of [
			"",
			"#",
			"#/",
			"#3",
			"#/0",
			"#/3/0",
			"#/-1",
			"#/03",
			"#/3/x",
			"#/3/2/1",
			"#/1.5",
			"#notes",
		]) {
			expect(parseDeckHash(hash), hash).toBeNull();
		}
	});
});

describe("formatDeckHash", () => {
	it("writes the step only after the first click", () => {
		expect(formatDeckHash({ slide: 2, step: 0 })).toBe("#/3");
		expect(formatDeckHash({ slide: 2, step: 1 })).toBe("#/3/2");
	});

	it("is read back as the same position", () => {
		for (const position of [
			{ slide: 0, step: 0 },
			{ slide: 0, step: 4 },
			{ slide: 41, step: 0 },
			{ slide: 41, step: 7 },
		]) {
			expect(parseDeckHash(formatDeckHash(position))).toEqual(position);
		}
	});
});
