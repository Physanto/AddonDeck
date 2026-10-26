// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { indentWidth, isBlank, isIndented, removeIndent } from "./indentation";

describe("indentation", () => {
	it("treats a leading space or tab as indentation", () => {
		expect(isIndented("  a")).toBe(true);
		expect(isIndented("\ta")).toBe(true);
		expect(isIndented("a ")).toBe(false);
	});

	it("treats whitespace-only lines as blank", () => {
		expect(isBlank(" \t ")).toBe(true);
		expect(isBlank(" a")).toBe(false);
	});

	it("counts a tab as two spaces", () => {
		expect(indentWidth("\t\tx")).toBe(4);
		expect(indentWidth("  \tx")).toBe(4);
		expect(indentWidth("x")).toBe(0);
	});

	it("removes only the requested width and keeps deeper indentation", () => {
		expect(removeIndent("    x", 2)).toBe("  x");
		expect(removeIndent("\t\tx", 2)).toBe("\tx");
		expect(removeIndent(" x", 2)).toBe("x");
	});
});
