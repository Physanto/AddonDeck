// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { isSeparator, splitSlides } from "./split-slides";

describe("isSeparator", () => {
	it("accepts three or more dashes alone on a line", () => {
		expect(isSeparator("---")).toBe(true);
		expect(isSeparator("-----  ")).toBe(true);
	});

	it("rejects indented, short or decorated separators", () => {
		expect(isSeparator(" ---")).toBe(false);
		expect(isSeparator("--")).toBe(false);
		expect(isSeparator("***")).toBe(false);
		expect(isSeparator("--- x")).toBe(false);
	});
});

describe("splitSlides", () => {
	it("splits at every separator, keeping line numbers", () => {
		const slides = splitSlides(["format: 1", "# A", "---", "# B"], 1);
		expect(slides).toEqual([
			{
				lines: [{ line: 2, raw: "# A", text: "# A" }],
				startLine: 2,
				edge: true,
			},
			{
				lines: [{ line: 4, raw: "# B", text: "# B" }],
				startLine: 4,
				edge: true,
			},
		]);
	});

	it("marks only the first and last slides as edges", () => {
		const slides = splitSlides(["a", "---", "b", "---", "c"], 0);
		expect(slides.map((slide) => slide.edge)).toEqual([true, false, true]);
	});

	it("separates even inside a code fence", () => {
		expect(splitSlides(["```", "---", "```"], 0)).toHaveLength(2);
	});
});
