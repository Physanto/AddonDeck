// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readTransform, writeTransform } from "./inline-transform";

describe("readTransform", () => {
	it("reads the shorthands written in either form", () => {
		expect(
			readTransform("translate(40px,7.5%) rotate(90deg) scale(2)").values,
		).toEqual({ x: "40px", y: "7.5%", rotate: "90deg", scale: "2" });
		expect(readTransform("translateX(1px) translateY(2px)").values).toEqual({
			x: "1px",
			y: "2px",
		});
		expect(readTransform("translate(5px)").values).toEqual({
			x: "5px",
			y: "0px",
		});
	});

	it("keeps nested parentheses inside a value", () => {
		expect(
			readTransform("translate(calc(10px + var(--gap)), 0px)").values.x,
		).toBe("calc(10px + var(--gap))");
	});

	it("keeps the functions it does not handle, as written", () => {
		expect(readTransform("skewX(5deg) scale(1, 2) translateZ(0)")).toEqual({
			values: {},
			others: ["skewX(5deg)", "scale(1, 2)", "translateZ(0)"],
		});
		expect(readTransform("")).toEqual({ values: {}, others: [] });
	});
});

describe("writeTransform", () => {
	it("writes translate, rotate and scale in that order, then the rest", () => {
		expect(
			writeTransform({
				values: { scale: "2", rotate: "45deg", y: "3px" },
				others: ["skewX(5deg)"],
			}),
		).toBe("translate(0px, 3px) rotate(45deg) scale(2) skewX(5deg)");
	});
});
