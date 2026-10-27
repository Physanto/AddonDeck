// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

// A block with three steps reaches the same state forwards, backwards, from
// the address hash and with clicks faster than its animations.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPluginRegistry } from "../src/registry/create-plugin-registry";
import { createRuntime, type Runtime } from "../src/start/create-runtime";
import {
	createManualAnimator,
	type ManualAnimator,
} from "./support/manual-animator";
import { createRevealPlugin } from "./support/reveal-plugin";

const SOURCE = [
	"# Before",
	"## Three steps\n\nreveal:\n  first\n  second\n  third",
	"# After",
].join("\n\n---\n\n");

let runtime: Runtime;
let animator: ManualAnimator;

function press(key: string): void {
	document.body.dispatchEvent(
		new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
	);
}

function openHash(hash: string): void {
	location.hash = hash;
	window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/** What the reveal block shows now, once its animations end. */
async function shown(): Promise<string> {
	await Promise.resolve();
	animator.endAll();
	await new Promise((resolve) => setTimeout(resolve, 0));
	const block = document.querySelector<HTMLElement>(
		'.adk-slide[data-index="1"] .adk-block[data-type="reveal"]',
	);
	return block?.innerHTML ?? "";
}

beforeEach(() => {
	location.hash = "";
	animator = createManualAnimator();
	const registry = createPluginRegistry();
	registry.register(createRevealPlugin());
	registry.register({
		kind: "adapter",
		adapter: "animator",
		create: () => animator,
	});
	const root = document.createElement("div");
	document.body.append(root);
	runtime = createRuntime({ root, source: SOURCE, registry, report: () => {} });
});

afterEach(() => {
	runtime.destroy();
	document.body.replaceChildren();
});

describe("a block with three steps", () => {
	it("shows the same states forwards, backwards and from the hash", async () => {
		press("ArrowRight");
		const forwards = [await shown()];
		for (let step = 1; step <= 3; step++) {
			press("ArrowRight");
			expect(runtime.navigator.position).toEqual({ slide: 1, step });
			forwards.push(await shown());
		}
		expect(new Set(forwards).size).toBe(4);

		const backwards: string[] = [];
		for (let step = 2; step >= 0; step--) {
			press("ArrowLeft");
			backwards.unshift(await shown());
		}
		expect(backwards).toEqual(forwards.slice(0, 3));

		for (const step of [3, 0, 2, 1]) {
			openHash(`#/2/${step + 1}`);
			expect(runtime.navigator.position).toEqual({ slide: 1, step });
			expect(await shown()).toBe(forwards[step]);
		}
	});

	it("comes back from the next slide at its end", async () => {
		openHash("#/2/4");
		const end = await shown();
		press("ArrowRight");
		expect(runtime.navigator.position).toEqual({ slide: 2, step: 0 });
		press("ArrowLeft");
		expect(runtime.navigator.position).toEqual({ slide: 1, step: 3 });
		expect(await shown()).toBe(end);
	});

	it("animates only the next click, and jumps to any other step", () => {
		openHash("#/2");
		press("ArrowRight");
		expect(animator.running).toBe(1);
		animator.endAll();
		openHash("#/2/4");
		expect(animator.running).toBe(0);
	});

	it("ends where slow clicks end when the clicks come faster than the animations", async () => {
		openHash("#/2/4");
		const end = await shown();
		openHash("#/2");
		press("ArrowRight");
		press("ArrowRight");
		press("ArrowRight");
		// Each click finished the previous one at once, so only the last animates.
		expect(animator.running).toBe(1);
		expect(runtime.navigator.position).toEqual({ slide: 1, step: 3 });
		expect(await shown()).toBe(end);
	});

	it("finishes the click still animating when the slide is left", async () => {
		openHash("#/2/3");
		press("ArrowRight");
		expect(animator.running).toBe(1);
		press("ArrowRight");
		expect(animator.running).toBe(0);
		press("ArrowLeft");
		const items = document.querySelectorAll<HTMLElement>(
			'.adk-slide[data-index="1"] li',
		);
		expect([...items].map((item) => item.style.opacity)).toEqual([
			"1",
			"1",
			"1",
		]);
	});
});
