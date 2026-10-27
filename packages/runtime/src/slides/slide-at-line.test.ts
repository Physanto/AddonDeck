// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { createBlockRegistry, parse } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { slideAtLine } from "./slide-at-line";

const { deck } = parse(
	"title: Lines\n\n# One\n\n---\n\n# Two\ntext\n\n---\n\n# Three",
	{ registry: createBlockRegistry([]) },
);

describe("slideAtLine", () => {
	it("finds the slide a line belongs to", () => {
		expect(slideAtLine(deck, 3)).toBe(0);
		expect(slideAtLine(deck, 7)).toBe(1);
		expect(slideAtLine(deck, 8)).toBe(1);
		expect(slideAtLine(deck, 12)).toBe(2);
		expect(slideAtLine(deck, 99)).toBe(2);
	});

	it("gives the header lines to the first slide", () => {
		expect(slideAtLine(deck, 1)).toBe(0);
	});
});
