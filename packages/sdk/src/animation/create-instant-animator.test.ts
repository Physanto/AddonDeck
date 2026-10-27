// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { createInstantAnimator } from "./create-instant-animator";

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
		await expect(animation.finished).resolves.toBeUndefined();
	});

	it("combines transform shorthands and keeps earlier ones", () => {
		const element = document.createElement("div");
		const animator = createInstantAnimator();
		animator.animate(element, { x: [0, 40], rotate: 90 });
		animator.animate(element, { scale: 2, y: "10%" });
		expect(element.style.transform).toBe(
			"translate(40px, 10%) scale(2) rotate(90deg)",
		);
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
