// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { stagger } from "./stagger";

function delays(delay: (index: number, count: number) => number): number[] {
	return [0, 1, 2, 3, 4].map((index) => delay(index, 5));
}

describe("stagger", () => {
	it("delays each target a step more than the previous one", () => {
		expect(delays(stagger(80))).toEqual([0, 80, 160, 240, 320]);
	});

	it("can start from the last target or from the center", () => {
		expect(delays(stagger(10, "last"))).toEqual([40, 30, 20, 10, 0]);
		expect(delays(stagger(10, "center"))).toEqual([20, 10, 0, 10, 20]);
	});
});
