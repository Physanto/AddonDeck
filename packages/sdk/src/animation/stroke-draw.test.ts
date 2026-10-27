// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { getStrokeDraw, setStrokeDraw } from "./stroke-draw";

function line(): SVGPathElement {
	return document.createElementNS("http://www.w3.org/2000/svg", "path");
}

describe("stroke draw", () => {
	it("counts a stroke that was never drawn as fully drawn", () => {
		expect(getStrokeDraw(line())).toBe(1);
	});

	it("reads back the part it drew, clamped between 0 and 1", () => {
		const path = line();
		setStrokeDraw(path, 0.4);
		expect(getStrokeDraw(path)).toBe(0.4);
		setStrokeDraw(path, 3);
		expect(getStrokeDraw(path)).toBe(1);
	});

	it("hides the line cap only while nothing is drawn", () => {
		const path = line();
		setStrokeDraw(path, 0);
		expect(path.style.getPropertyValue("stroke-linecap")).toBe("butt");
		setStrokeDraw(path, 0.1);
		expect(path.style.getPropertyValue("stroke-linecap")).toBe("");
	});

	it("leaves elements that are not SVG shapes alone", () => {
		const element = document.createElement("div");
		setStrokeDraw(element, 0);
		expect(element.getAttribute("style")).toBeNull();
		expect(getStrokeDraw(element)).toBe(1);
	});
});
