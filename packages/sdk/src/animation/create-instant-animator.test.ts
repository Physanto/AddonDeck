// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { createInstantAnimator } from "./create-instant-animator";

const SVG = "http://www.w3.org/2000/svg";

/** A path from (0, 0) to (30, 30); the test DOM does not measure paths. */
function diagonal(): SVGPathElement {
	const path = document.createElementNS(SVG, "path");
	const length = 30 * Math.SQRT2;
	path.getTotalLength = () => length;
	path.getPointAtLength = (distance) =>
		new DOMPoint(distance / Math.SQRT2, distance / Math.SQRT2);
	return path;
}

describe("createInstantAnimator", () => {
	it("applies the final value of each property at once", async () => {
		const element = document.createElement("div");
		const animation = createInstantAnimator().animate(element, {
			opacity: [0, 1],
			backgroundColor: "var(--color-accent)",
			width: 120,
			"--progress": 0.5,
		});
		expect(element.style.opacity).toBe("1");
		expect(element.style.backgroundColor).toBe("var(--color-accent)");
		expect(element.style.width).toBe("120px");
		expect(element.style.getPropertyValue("--progress")).toBe("0.5");
		expect(animation.duration).toBe(0);
		expect(animation.progress).toBe(1);
		await expect(animation.finished).resolves.toBeUndefined();
	});

	it("combines transform shorthands and keeps earlier ones", () => {
		const element = document.createElement("div");
		const animator = createInstantAnimator();
		animator.animate(element, { x: [0, 40], rotate: 90 });
		animator.animate(element, { scale: 2, y: "10%" });
		expect(element.style.transform).toBe(
			"translate(40px, 10%) rotate(90deg) scale(2)",
		);
	});

	it("continues from a transform another animator wrote", () => {
		const element = document.createElement("div");
		element.style.transform = "translateX(10px) skewX(5deg) scale(3)";
		createInstantAnimator().animate(element, { rotate: 45 });
		expect(element.style.transform).toBe(
			"translate(10px, 0px) rotate(45deg) scale(3) skewX(5deg)",
		);
	});

	it("draws the stroke of SVG shapes", () => {
		const line = document.createElementNS(SVG, "path");
		createInstantAnimator().animate(line, { draw: [0, 0.25] });
		expect(line.getAttribute("pathLength")).toBe("1");
		expect(line.style.getPropertyValue("stroke-dasharray")).toBe("0.25 1");
	});

	it("moves targets to the end of a path, turned if asked", () => {
		const element = document.createElement("div");
		const animator = createInstantAnimator();
		animator.animate(element, { x: 999 }, { path: { element: diagonal() } });
		expect(element.style.transform).toBe("translate(30px, 30px)");
		animator.animate(
			element,
			{},
			{ path: { element: diagonal(), rotate: true } },
		);
		expect(element.style.transform).toBe("translate(30px, 30px) rotate(45deg)");
	});

	it("animates every target and skips elements without style", () => {
		const first = document.createElement("span");
		const second = document.createElement("span");
		const plain = document.createElementNS("urn:test", "plain");
		createInstantAnimator().animate([first, second, plain], { opacity: 0 });
		expect([first.style.opacity, second.style.opacity]).toEqual(["0", "0"]);
	});

	it("treats elements with a length, such as forms, as one target", () => {
		const form = document.createElement("form");
		form.append(document.createElement("input"));
		createInstantAnimator().animate(form, { opacity: 0.5 });
		expect(form.style.opacity).toBe("0.5");
	});

	it("applies each step of a timeline as it is added", async () => {
		const element = document.createElement("div");
		const timeline = createInstantAnimator()
			.timeline()
			.add(element, { opacity: 0.2 })
			.add(element, { opacity: 0.8 }, { at: 100 });
		expect(element.style.opacity).toBe("0.8");
		timeline.play();
		timeline.pause();
		timeline.seek(50);
		timeline.finish();
		timeline.cancel();
		await expect(timeline.finished).resolves.toBeUndefined();
	});
});
