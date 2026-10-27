// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { pathEnd } from "./path-end";

const SVG = "http://www.w3.org/2000/svg";

/** A vertical path from (10, 0) to (10, 20) inside an SVG scaled by 2 and moved 5px right. */
function scaledPath(): SVGPathElement {
	const path = document.createElementNS(SVG, "path");
	path.getTotalLength = () => 20;
	path.getPointAtLength = (distance) => new DOMPoint(10, distance);
	path.getCTM = () => new DOMMatrix([2, 0, 0, 2, 5, 0]);
	return path;
}

describe("pathEnd", () => {
	it("places other elements in the coordinates of the SVG viewport", () => {
		expect(pathEnd(scaledPath(), document.createElement("div"))).toEqual({
			x: 25,
			y: 40,
			angle: 90,
		});
	});

	it("places SVG targets in the coordinates of the path", () => {
		expect(
			pathEnd(scaledPath(), document.createElementNS(SVG, "circle")),
		).toEqual({
			x: 10,
			y: 20,
			angle: 90,
		});
	});
});
