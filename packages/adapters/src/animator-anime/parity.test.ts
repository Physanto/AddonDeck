// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterAll, describe, expect, it, vi } from "vitest";

// anime.js keeps a reference to `Date.now` when it loads, so time must be
// simulated before it is imported.
vi.hoisted(() => {
	vi.useFakeTimers({
		toFake: [
			"Date",
			"requestAnimationFrame",
			"cancelAnimationFrame",
			"performance",
		],
	});
});

import {
	type AnimationOptions,
	type AnimationProps,
	createInstantAnimator,
	type MotionTokens,
} from "@addondeck/sdk";
import { createAnimeAnimator } from "./create-anime-animator";

afterAll(() => {
	vi.useRealTimers();
});

const SVG = "http://www.w3.org/2000/svg";

const MOTION: MotionTokens = {
	id: "test",
	duration: { xs: 50, s: 100, m: 200, l: 400 },
	easing: { enter: "outCubic", exit: "inCubic", move: "inOutQuad" },
	stagger: 50,
	overshoot: 0,
};

const anime = createAnimeAnimator({ motion: MOTION });
const instant = createInstantAnimator();

/** A path from (0, 0) to (0, 80), in an SVG moved 10px right; the test DOM does not measure paths. */
function verticalPath(): SVGPathElement {
	const path = document.createElementNS(SVG, "path");
	path.getTotalLength = () => 80;
	path.getPointAtLength = (distance) => new DOMPoint(0, distance);
	path.getCTM = () => new DOMMatrix([1, 0, 0, 1, 10, 0]);
	return path;
}

function themed(tag: "div" | "path"): HTMLElement | SVGPathElement {
	const element =
		tag === "div"
			? document.createElement("div")
			: document.createElementNS(SVG, "path");
	element.style.setProperty("--color-accent", "rgb(255, 0, 0)");
	document.body.append(element);
	return element;
}

/** Transform shorthands with their defaults, whatever the form each animator writes. */
function transformOf(
	element: HTMLElement | SVGElement,
): Record<string, number> {
	const values: Record<string, number> = { x: 0, y: 0, rotate: 0, scale: 1 };
	for (const [, name, args = ""] of element.style.transform.matchAll(
		/(\w+)\(([^)]*)\)/g,
	)) {
		const [first = "0", second = "0"] = args
			.split(",")
			.map((arg) => arg.trim());
		if (name === "translate") {
			values.x = Number.parseFloat(first);
			values.y = Number.parseFloat(second);
		} else if (name === "translateX") values.x = Number.parseFloat(first);
		else if (name === "translateY") values.y = Number.parseFloat(first);
		else if (name === "rotate" || name === "scale")
			values[name] = Number.parseFloat(first);
	}
	return values;
}

/** Inline styles other than `transform`. */
function stylesOf(element: HTMLElement | SVGElement): Record<string, string> {
	const styles: Record<string, string> = {};
	for (const property of Array.from(element.style)) {
		if (property !== "transform")
			styles[property] = element.style.getPropertyValue(property);
	}
	return styles;
}

function expectSameEnd(
	tag: "div" | "path",
	props: AnimationProps,
	options?: AnimationOptions,
): void {
	const expected = themed(tag);
	instant.animate(expected, props, options);
	const actual = themed(tag);
	anime.animate(actual, props, options).finish();
	expect(stylesOf(actual)).toEqual(stylesOf(expected));
	const end = transformOf(expected);
	for (const [key, value] of Object.entries(transformOf(actual))) {
		expect(value, key).toBeCloseTo(end[key] ?? Number.NaN, 3);
	}
	expect(actual.getAttribute("pathLength")).toBe(
		expected.getAttribute("pathLength"),
	);
}

describe("anime.js and the instant animator", () => {
	it("end with the same styles", () => {
		expectSameEnd("div", {
			opacity: [0, 1],
			width: 120,
			x: 40,
			rotate: 90,
			scale: 2,
			"--progress": 0.5,
			backgroundColor: "var(--color-accent)",
		});
	});

	it("end a motion path at the same point", () => {
		expectSameEnd(
			"div",
			{ opacity: 0.5 },
			{ path: { element: verticalPath(), rotate: true } },
		);
	});

	it("end a stroke drawing the same way", () => {
		expectSameEnd("path", { draw: [1, 0.3], strokeWidth: 4 });
	});

	it("continue from the transform the other one wrote", async () => {
		const element = themed("div");
		instant.animate(element, { x: 40, rotate: 90 });
		anime.animate(element, { scale: 2 }, { duration: 100 });
		await vi.advanceTimersByTimeAsync(200);
		expect(transformOf(element)).toEqual({ x: 40, y: 0, rotate: 90, scale: 2 });
		instant.animate(element, { y: 10 });
		expect(transformOf(element)).toEqual({
			x: 40,
			y: 10,
			rotate: 90,
			scale: 2,
		});
	});

	it("continue a stroke from where the other one left it", async () => {
		const line = themed("path");
		instant.animate(line, { draw: 0.5 });
		anime.animate(line, { draw: 1 }, { duration: 100, easing: "linear" });
		await vi.advanceTimersByTimeAsync(10);
		const drawn = Number.parseFloat(
			line.style.getPropertyValue("stroke-dasharray"),
		);
		expect(drawn).toBeGreaterThanOrEqual(0.5);
		expect(drawn).toBeLessThan(0.7);
	});
});
