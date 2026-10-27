// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { toggleFullscreen } from "./toggle-fullscreen";

afterEach(() => {
	Reflect.deleteProperty(document, "fullscreenElement");
});

/** The test DOM has no Fullscreen API, so each test sets the part it needs. */
function setFullscreenElement(element: Element | null): void {
	Object.defineProperty(document, "fullscreenElement", {
		configurable: true,
		value: element,
	});
}

describe("toggleFullscreen", () => {
	it("enters full screen with the whole page", () => {
		setFullscreenElement(null);
		const request = vi.fn(() => Promise.resolve());
		document.documentElement.requestFullscreen = request;
		toggleFullscreen(document);
		expect(request).toHaveBeenCalledOnce();
	});

	it("leaves full screen", () => {
		setFullscreenElement(document.documentElement);
		const exit = vi.fn(() => Promise.resolve());
		document.exitFullscreen = exit;
		toggleFullscreen(document);
		expect(exit).toHaveBeenCalledOnce();
	});

	it("ignores a refusal of the browser", async () => {
		setFullscreenElement(null);
		document.documentElement.requestFullscreen = () =>
			Promise.reject(new TypeError("not allowed"));
		expect(() => toggleFullscreen(document)).not.toThrow();
		// Vitest fails the run on an unhandled rejection, which would surface here.
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
});
