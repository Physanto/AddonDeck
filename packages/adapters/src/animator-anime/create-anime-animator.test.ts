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

import { type MotionTokens, stagger } from "@addondeck/sdk";
import { createAnimeAnimator } from "./create-anime-animator";

afterAll(() => {
	vi.useRealTimers();
});

const SVG = "http://www.w3.org/2000/svg";

const MOTION: MotionTokens = {
	id: "test",
	duration: { xs: 100, s: 200, m: 1000, l: 2000 },
	easing: { enter: "outCubic", exit: "inCubic", move: "linear" },
	stagger: 100,
	overshoot: 0,
};

const animator = createAnimeAnimator({ motion: MOTION });

function box(): HTMLDivElement {
	const element = document.createElement("div");
	document.body.append(element);
	return element;
}

/** A path from (0, 0) to (100, 0) followed by (100, 100); the test DOM does not measure paths. */
function corner(): SVGPathElement {
	const svg = document.createElementNS(SVG, "svg");
	const path = document.createElementNS(SVG, "path");
	path.getTotalLength = () => 200;
	path.getPointAtLength = (distance) =>
		distance <= 100
			? new DOMPoint(distance, 0)
			: new DOMPoint(100, distance - 100);
	svg.append(path);
	document.body.append(svg);
	return path;
}

function opacity(element: HTMLElement): number {
	return Number(element.style.opacity);
}

async function advance(milliseconds: number): Promise<void> {
	await vi.advanceTimersByTimeAsync(milliseconds);
}

/** Whether a promise has settled; timeouts are real, so this waits for every pending callback. */
async function isSettled(promise: Promise<void>): Promise<boolean> {
	let settled = false;
	void promise.then(() => {
		settled = true;
	});
	await new Promise((resolve) => setTimeout(resolve, 0));
	return settled;
}

describe("createAnimeAnimator", () => {
	it("animates properties and transform shorthands to their final values", async () => {
		const element = box();
		const animation = animator.animate(element, {
			opacity: [0, 1],
			width: [0, 120],
			x: [0, 40],
			rotate: 90,
			scale: 2,
			"--progress": [0, 1],
		});
		await advance(500);
		expect(opacity(element)).toBeCloseTo(0.5, 1);
		await advance(600);
		expect(element.style.opacity).toBe("1");
		expect(element.style.width).toBe("120px");
		expect(element.style.getPropertyValue("--progress")).toBe("1");
		expect(element.style.transform).toBe(
			"translateX(40px) rotate(90deg) scale(2)",
		);
		await expect(animation.finished).resolves.toBeUndefined();
	});

	it("takes the duration and easing it is not given from the motion tokens", async () => {
		const linear = box();
		const eased = box();
		expect(animator.animate(linear, { opacity: [0, 1] }).duration).toBe(1000);
		const fast = animator.animate(
			eased,
			{ opacity: [0, 1] },
			{ duration: 200, easing: "outCubic" },
		);
		expect(fast.duration).toBe(200);
		await advance(100);
		expect(opacity(linear)).toBeCloseTo(0.1, 1);
		expect(opacity(eased)).toBeGreaterThan(0.8);
	});

	it("reports its progress, delays included", async () => {
		const animation = animator.animate(
			box(),
			{ opacity: [0, 1] },
			{ delay: 1000 },
		);
		expect(animation.duration).toBe(2000);
		expect(animation.progress).toBe(0);
		await advance(1000);
		expect(animation.progress).toBeCloseTo(0.5, 1);
		await advance(1100);
		expect(animation.progress).toBe(1);
	});

	it("shows a time when seeking and stays paused there", async () => {
		const element = box();
		const animation = animator.animate(element, { opacity: [0, 1] });
		animation.seek(250);
		expect(opacity(element)).toBeCloseTo(0.25, 2);
		expect(animation.progress).toBeCloseTo(0.25, 2);
		await advance(2000);
		expect(opacity(element)).toBeCloseTo(0.25, 2);
		expect(await isSettled(animation.finished)).toBe(false);
		animation.play();
		await advance(800);
		expect(element.style.opacity).toBe("1");
		await expect(animation.finished).resolves.toBeUndefined();
	});

	it("pauses and resumes without jumping", async () => {
		const element = box();
		const animation = animator.animate(element, { opacity: [0, 1] });
		await advance(300);
		animation.pause();
		const paused = opacity(element);
		await advance(1000);
		expect(opacity(element)).toBe(paused);
		animation.play();
		await advance(100);
		expect(opacity(element)).toBeGreaterThan(paused);
		expect(opacity(element)).toBeLessThan(0.6);
	});

	it("jumps to the final values when finished", async () => {
		const element = box();
		const animation = animator.animate(element, { opacity: [0, 1], x: 40 });
		await advance(100);
		animation.finish();
		expect(element.style.opacity).toBe("1");
		expect(element.style.transform).toContain("translateX(40px)");
		expect(await isSettled(animation.finished)).toBe(true);
		animation.play();
		await advance(100);
		expect(element.style.opacity).toBe("1");
	});

	it("keeps the values already applied when cancelled, and still settles", async () => {
		const element = box();
		const animation = animator.animate(element, { opacity: [0, 1] });
		await advance(400);
		animation.cancel();
		const stopped = opacity(element);
		await advance(1000);
		expect(opacity(element)).toBe(stopped);
		expect(stopped).toBeGreaterThan(0.3);
		expect(stopped).toBeLessThan(0.5);
		expect(await isSettled(animation.finished)).toBe(true);
	});

	it("settles when a later animation replaces all its properties", async () => {
		const element = box();
		const first = animator.animate(element, { opacity: [0, 1] });
		await advance(100);
		const second = animator.animate(element, { opacity: 0 }, { duration: 100 });
		await advance(200);
		expect(await isSettled(first.finished)).toBe(true);
		await expect(second.finished).resolves.toBeUndefined();
		expect(element.style.opacity).toBe("0");
	});

	it("staggers targets with a delay function", async () => {
		const items = [box(), box(), box()];
		const animation = animator.animate(
			items,
			{ opacity: [0, 1] },
			{ duration: 100, delay: stagger(MOTION.stagger) },
		);
		expect(animation.duration).toBe(300);
		await advance(150);
		const [first, second, third] = items.map(opacity);
		expect(first).toBe(1);
		expect(second).toBeGreaterThan(0.2);
		expect(second).toBeLessThan(0.8);
		expect(third).toBe(0);
		await advance(200);
		expect(items.map(opacity)).toEqual([1, 1, 1]);
	});

	it("ends zero-length animations at once, as the minimal personality needs", async () => {
		const element = box();
		const animation = animator.animate(
			element,
			{ opacity: [0, 1] },
			{ duration: 0 },
		);
		expect(element.style.opacity).toBe("1");
		await advance(20);
		expect(await isSettled(animation.finished)).toBe(true);
	});

	it("writes theme variables back once it ends", async () => {
		const element = box();
		element.style.setProperty("--color-accent", "rgb(255, 0, 0)");
		element.style.backgroundColor = "rgb(0, 0, 0)";
		animator.animate(
			element,
			{ backgroundColor: "var(--color-accent)" },
			{ duration: 100 },
		);
		await advance(200);
		expect(element.style.backgroundColor).toBe("var(--color-accent)");
	});

	it("moves targets along a path, turned if asked", async () => {
		const path = corner();
		const element = box();
		const animation = animator.animate(
			element,
			{ x: 999 },
			{ path: { element: path, rotate: true } },
		);
		await advance(250);
		expect(element.style.transform).toMatch(
			/^translate\(5\d(\.\d+)?px,0px\) rotate\(0deg\)$/,
		);
		await advance(1000);
		expect(element.style.transform).toBe(
			"translate(100px,100px) rotate(90deg)",
		);
		await expect(animation.finished).resolves.toBeUndefined();
	});

	it("draws and erases SVG strokes", async () => {
		const line = document.createElementNS(SVG, "path");
		animator.animate(line, { draw: [0, 1] }, { duration: 100 });
		await advance(200);
		expect(line.style.getPropertyValue("stroke-dasharray")).toBe("1 1");
		const erase = animator.animate([line, box()], { draw: 0, opacity: 0.5 });
		await advance(500);
		expect(
			Number.parseFloat(line.style.getPropertyValue("stroke-dasharray")),
		).toBeCloseTo(0.5, 1);
		await advance(600);
		expect(line.style.getPropertyValue("stroke-dasharray")).toBe("0 1");
		expect(line.style.getPropertyValue("stroke-linecap")).toBe("butt");
		await expect(erase.finished).resolves.toBeUndefined();
	});

	it("ignores an empty list of targets", async () => {
		const animation = animator.animate([], { opacity: 1 });
		expect(animation.duration).toBe(0);
		animation.finish();
		await expect(animation.finished).resolves.toBeUndefined();
	});
});

describe("timeline", () => {
	it("starts each step when the previous ends, or at the given time", async () => {
		const first = box();
		const second = box();
		const third = box();
		const timeline = animator
			.timeline()
			.add(first, { opacity: [0, 1] }, { duration: 100 })
			.add(second, { opacity: [0, 1] }, { duration: 100 })
			.add(third, { opacity: [0, 1] }, { duration: 100, at: 50 });
		expect(timeline.duration).toBe(200);
		await advance(60);
		expect(opacity(first)).toBeGreaterThan(0.5);
		expect(opacity(second)).toBe(0);
		expect(opacity(third)).toBeGreaterThan(0);
		expect(opacity(third)).toBeLessThan(opacity(first));
		await advance(100);
		expect(opacity(first)).toBe(1);
		expect(opacity(second)).toBeGreaterThan(0.5);
		expect(opacity(second)).toBeLessThan(1);
		expect(opacity(third)).toBe(1);
		await advance(100);
		expect(opacity(second)).toBe(1);
		await expect(timeline.finished).resolves.toBeUndefined();
	});

	it("seeks across steps and controls them as one", async () => {
		const first = box();
		const second = box();
		const timeline = animator
			.timeline()
			.add(first, { x: [0, 100] }, { duration: 100 })
			.add(second, { draw: [0, 1], opacity: [0, 1] }, { duration: 100 });
		timeline.seek(150);
		expect(first.style.transform).toBe("translateX(100px)");
		expect(opacity(second)).toBeCloseTo(0.5, 2);
		expect(timeline.progress).toBeCloseTo(0.75, 2);
		timeline.finish();
		expect(opacity(second)).toBe(1);
		await expect(timeline.finished).resolves.toBeUndefined();
	});
});
