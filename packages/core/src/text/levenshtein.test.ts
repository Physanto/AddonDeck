// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { levenshtein } from "./levenshtein";

describe("levenshtein", () => {
	it("is zero for equal strings", () => {
		expect(levenshtein("graph", "graph")).toBe(0);
	});

	it("counts insertions, deletions and substitutions", () => {
		expect(levenshtein("secuence", "sequence")).toBe(1);
		expect(levenshtein("titel", "title")).toBe(2);
		expect(levenshtein("kitten", "sitting")).toBe(3);
	});

	it("measures against the empty string by length", () => {
		expect(levenshtein("", "code")).toBe(4);
		expect(levenshtein("code", "")).toBe(4);
	});
});
