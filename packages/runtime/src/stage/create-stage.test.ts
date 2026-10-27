// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { createStage } from "./create-stage";

/** Makes the next viewports measure `width`×`height`; the test DOM has no layout. */
function setViewportSize(width: number, height: number): void {
	Object.defineProperty(HTMLElement.prototype, "clientWidth", {
		configurable: true,
		get: () => width,
	});
	Object.defineProperty(HTMLElement.prototype, "clientHeight", {
		configurable: true,
		get: () => height,
	});
}

afterEach(() => {
	Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
	Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
	document.body.replaceChildren();
});

describe("createStage", () => {
	it("draws a 1920×1080 stage scaled and centered in the viewport", () => {
		setViewportSize(1920, 1200);
		const stage = createStage(document.body);
		expect(stage.viewport.parentElement).toBe(document.body);
		expect(stage.element.parentElement).toBe(stage.viewport);
		expect(stage.element.style.width).toBe("1920px");
		expect(stage.element.style.height).toBe("1080px");
		expect(stage.element.style.transform).toBe("translate(0px, 60px) scale(1)");
		expect(stage.info).toMatchObject({ width: 1920, height: 1080, scale: 1 });
	});

	it("fits again when the window is resized", () => {
		setViewportSize(1920, 1080);
		const stage = createStage(document.body);
		setViewportSize(960, 540);
		window.dispatchEvent(new Event("resize"));
		expect(stage.info.scale).toBe(0.5);
		expect(stage.element.style.transform).toBe(
			"translate(0px, 0px) scale(0.5)",
		);
	});

	it("stops following the window and leaves the page when destroyed", () => {
		setViewportSize(1920, 1080);
		const stage = createStage(document.body);
		stage.destroy();
		setViewportSize(960, 540);
		window.dispatchEvent(new Event("resize"));
		expect(stage.info.scale).toBe(1);
		expect(document.body.children).toHaveLength(0);
	});
});
