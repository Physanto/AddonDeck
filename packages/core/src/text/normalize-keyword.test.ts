// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { normalizeKeyword } from "./normalize-keyword";

describe("normalizeKeyword", () => {
	it("ignores capitals", () => {
		expect(normalizeKeyword("SEQUENCE")).toBe("sequence");
	});

	it("removes accents", () => {
		expect(normalizeKeyword("séquence")).toBe("sequence");
		expect(normalizeKeyword("Código")).toBe("codigo");
	});

	it("turns underscores and spaces into dashes", () => {
		expect(normalizeKeyword("line_of_time")).toBe("line-of-time");
		expect(normalizeKeyword("Line of time")).toBe("line-of-time");
	});

	it("trims surrounding whitespace", () => {
		expect(normalizeKeyword("  title \t")).toBe("title");
	});

	it("folds compatibility characters", () => {
		expect(normalizeKeyword("ｓｅｑｕｅｎｃｅ")).toBe("sequence");
	});
});
