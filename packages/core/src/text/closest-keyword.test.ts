// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { closestKeyword } from "./closest-keyword";

describe("closestKeyword", () => {
	const keywords = ["sequence", "graph", "code", "chart"];

	it("suggests a keyword at most two edits away", () => {
		expect(closestKeyword("secuence", keywords)).toBe("sequence");
		expect(closestKeyword("grahp", keywords)).toBe("graph");
	});

	it("suggests nothing when every keyword is farther", () => {
		expect(closestKeyword("steps", keywords)).toBeNull();
	});

	it("normalizes the word before comparing", () => {
		expect(closestKeyword("SÉCUENCE", keywords)).toBe("sequence");
	});

	it("prefers the closest keyword", () => {
		expect(closestKeyword("chert", ["cart", "chart"])).toBe("chart");
	});

	it("breaks ties by the order of the candidates", () => {
		expect(closestKeyword("cod", ["code", "cot"])).toBe("code");
		expect(closestKeyword("cod", ["cot", "code"])).toBe("cot");
	});

	it("accepts a custom maximum distance", () => {
		expect(closestKeyword("secuense", keywords, 1)).toBeNull();
	});
});
