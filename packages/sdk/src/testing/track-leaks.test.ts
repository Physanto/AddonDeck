// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { type LeakTracker, trackLeaks } from "./track-leaks";

let tracker: LeakTracker | undefined;

function start(): LeakTracker {
	tracker = trackLeaks();
	return tracker;
}

afterEach(() => {
	tracker?.restore();
	tracker = undefined;
});

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("trackLeaks", () => {
	it("reports listeners that are still attached", () => {
		const leaks = start();
		const handler = (): void => {};
		const button = document.createElement("button");
		document.body.append(button);
		button.addEventListener("click", handler);
		window.addEventListener("resize", handler);
		document.addEventListener("keydown", handler, true);
		expect(leaks.leaks()).toEqual([
			'a "click" listener on <button>',
			'a "resize" listener on window',
			'a "keydown" listener on document',
		]);
		button.removeEventListener("click", handler);
		window.removeEventListener("resize", handler);
		document.removeEventListener("keydown", handler, { capture: true });
		button.remove();
		expect(leaks.leaks()).toEqual([]);
	});

	it("matches listeners by capture, like the DOM", () => {
		const leaks = start();
		const handler = (): void => {};
		document.addEventListener("click", handler, true);
		document.addEventListener("click", handler, { capture: true });
		document.removeEventListener("click", handler);
		expect(leaks.leaks()).toHaveLength(1);
		document.removeEventListener("click", handler, true);
		expect(leaks.leaks()).toEqual([]);
	});

	it("forgets listeners removed by once, by a signal or with their node", () => {
		const leaks = start();
		const controller = new AbortController();
		const aborted = new AbortController();
		aborted.abort();
		const handler = (): void => {};
		document.addEventListener("ping", handler, { once: true });
		document.addEventListener("pong", handler, { signal: controller.signal });
		document.addEventListener("pang", handler, { signal: aborted.signal });
		document.createElement("div").addEventListener("click", handler);
		document.dispatchEvent(new Event("ping"));
		controller.abort();
		expect(leaks.leaks()).toEqual([]);
	});

	it("reports timers, intervals and frames that are still pending", async () => {
		const leaks = start();
		const timeout = setTimeout(() => {}, 1000);
		const interval = setInterval(() => {}, 1000);
		const frame = requestAnimationFrame(() => {});
		expect(leaks.leaks()).toEqual([
			"a timeout that was never cleared",
			"an interval that was never cleared",
			"an animation frame that was never cancelled",
		]);
		clearTimeout(timeout);
		clearInterval(interval);
		cancelAnimationFrame(frame);
		expect(leaks.leaks()).toEqual([]);
	});

	it("forgets timeouts and frames once they run", async () => {
		const leaks = start();
		await new Promise((resolve) => setTimeout(resolve, 0));
		await nextFrame();
		expect(leaks.leaks()).toEqual([]);
	});

	it("puts the original functions back", () => {
		const add = EventTarget.prototype.addEventListener;
		const windowAdd = window.addEventListener;
		const timeout = globalThis.setTimeout;
		start().restore();
		tracker = undefined;
		expect(EventTarget.prototype.addEventListener).toBe(add);
		expect(window.addEventListener).toBe(windowAdd);
		expect(globalThis.setTimeout).toBe(timeout);
	});
});
