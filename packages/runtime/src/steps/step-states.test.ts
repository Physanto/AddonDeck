// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepClick } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { stepStates } from "./step-states";

const CLICKS: readonly StepClick[] = [
	[{ node: 0, from: 0, to: 1 }],
	[
		{ node: 0, from: 1, to: 2 },
		{ node: 2, from: 0, to: 1 },
	],
	[{ node: 2, from: 1, to: 3 }],
];

describe("stepStates", () => {
	it("starts every node of the plan at step 0", () => {
		expect(stepStates(CLICKS, 0)).toEqual(
			new Map([
				[0, 0],
				[2, 0],
			]),
		);
	});

	it("gives each node the end of its last advance among the clicks played", () => {
		expect(stepStates(CLICKS, 1)).toEqual(
			new Map([
				[0, 1],
				[2, 0],
			]),
		);
		expect(stepStates(CLICKS, 2)).toEqual(
			new Map([
				[0, 2],
				[2, 1],
			]),
		);
		expect(stepStates(CLICKS, 3)).toEqual(
			new Map([
				[0, 2],
				[2, 3],
			]),
		);
	});

	it("is empty for a slide without clicks", () => {
		expect(stepStates([], 0).size).toBe(0);
	});
});
