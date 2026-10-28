// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { TEST_MOTION_TOKENS } from "../testing/test-tokens";
import { createInstantAnimator } from "./create-instant-animator";
import { playReveal, REVEAL_RISE, setRevealed } from "./reveal";

function items(count: number): HTMLElement[] {
	return Array.from({ length: count }, () => document.createElement("li"));
}

describe("reveal", () => {
	it("hides below its place and shows in place at once", () => {
		const animator = createInstantAnimator();
		const [item] = items(1);
		if (item === undefined) throw new Error("no item");
		setRevealed(animator, [item], false);
		expect(item.style.opacity).toBe("0");
		expect(item.style.transform).toBe(`translate(0px, ${REVEAL_RISE}px)`);
		setRevealed(animator, [item], true);
		expect(item.style.opacity).toBe("1");
		expect(item.style.transform).toBe("translate(0px, 0px)");
	});

	it("ends a reveal with the styles of a shown element", async () => {
		const animator = createInstantAnimator();
		const [played, set] = items(2);
		if (played === undefined || set === undefined) throw new Error("no items");
		setRevealed(animator, [played], false);
		await playReveal({ animator, motion: TEST_MOTION_TOKENS }, [played]);
		setRevealed(animator, [set], true);
		expect(played.outerHTML).toBe(set.outerHTML);
	});

	it("animates with the deck motion, one element after another", async () => {
		const animator = createInstantAnimator();
		const animate = vi.spyOn(animator, "animate");
		const targets = items(3);
		await playReveal({ animator, motion: TEST_MOTION_TOKENS }, targets);
		const options = animate.mock.calls[0]?.[2];
		expect(options).toMatchObject({
			duration: TEST_MOTION_TOKENS.duration.m,
			easing: TEST_MOTION_TOKENS.easing.enter,
		});
		const delay = options?.delay;
		expect(typeof delay === "function" ? delay(2, 3) : delay).toBe(
			2 * TEST_MOTION_TOKENS.stagger,
		);
	});

	it("does nothing without elements", async () => {
		const animator = createInstantAnimator();
		const animate = vi.spyOn(animator, "animate");
		setRevealed(animator, [], true);
		await playReveal({ animator, motion: TEST_MOTION_TOKENS }, []);
		expect(animate).not.toHaveBeenCalled();
	});
});
