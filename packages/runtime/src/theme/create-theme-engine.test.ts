// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { DEFAULT_DECK_META } from "@addondeck/core";
import type { MotionTokens } from "@addondeck/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createThemeEngine, REDUCED_MOTION_QUERY } from "./create-theme-engine";
import { DEFAULT_MOTION_TOKENS, MINIMAL_MOTION_TOKENS } from "./default-tokens";

/** Replaces the reduced motion setting of the test window with one the test controls. */
function fakeReducedMotion(matches: boolean) {
	const listeners = new Set<() => void>();
	const query = {
		get matches() {
			return matches;
		},
		addEventListener: vi.fn((_: string, listener: () => void) =>
			listeners.add(listener),
		),
		removeEventListener: vi.fn((_: string, listener: () => void) =>
			listeners.delete(listener),
		),
	};
	const matchMedia = vi
		.spyOn(window, "matchMedia")
		.mockReturnValue(query as unknown as MediaQueryList);
	return {
		matchMedia,
		listeners,
		set(value: boolean) {
			matches = value;
			for (const listener of [...listeners]) listener();
		},
	};
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("createThemeEngine", () => {
	it("writes the theme and the motion as CSS variables on the element", () => {
		fakeReducedMotion(false);
		const element = document.createElement("div");
		const engine = createThemeEngine({
			element,
			meta: { ...DEFAULT_DECK_META, color: "#0a7" },
		});
		expect(element.style.getPropertyValue("--color-primary")).toBe("#0a7");
		expect(element.style.getPropertyValue("--radius")).toBe("12px");
		expect(element.style.getPropertyValue("--adk-duration-m")).toBe("600ms");
		expect(engine.theme.colors.primary).toBe("#0a7");
		expect(engine.motion).toBe(DEFAULT_MOTION_TOKENS);
	});

	it("uses minimal when the system asks for reduced motion", () => {
		const { matchMedia } = fakeReducedMotion(true);
		const element = document.createElement("div");
		const engine = createThemeEngine({ element, meta: DEFAULT_DECK_META });
		expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
		expect(engine.motion).toBe(MINIMAL_MOTION_TOKENS);
		expect(element.style.getPropertyValue("--adk-duration-m")).toBe("0ms");
	});

	it("follows the setting while the deck is shown", () => {
		const setting = fakeReducedMotion(false);
		const element = document.createElement("div");
		const engine = createThemeEngine({ element, meta: DEFAULT_DECK_META });
		const changes: MotionTokens[] = [];
		engine.subscribe((motion) => changes.push(motion));
		setting.set(true);
		expect(engine.motion).toBe(MINIMAL_MOTION_TOKENS);
		expect(element.style.getPropertyValue("--adk-duration-m")).toBe("0ms");
		setting.set(true);
		setting.set(false);
		expect(changes).toEqual([MINIMAL_MOTION_TOKENS, DEFAULT_MOTION_TOKENS]);
	});

	it("does not tell a listener that unsubscribed", () => {
		const setting = fakeReducedMotion(false);
		const engine = createThemeEngine({
			element: document.createElement("div"),
			meta: DEFAULT_DECK_META,
		});
		const listener = vi.fn();
		engine.subscribe(listener)();
		setting.set(true);
		expect(listener).not.toHaveBeenCalled();
	});

	it("removes its variables and stops following the setting when destroyed", () => {
		const setting = fakeReducedMotion(false);
		const element = document.createElement("div");
		element.style.setProperty("--other", "kept");
		const engine = createThemeEngine({ element, meta: DEFAULT_DECK_META });
		engine.destroy();
		expect(setting.listeners.size).toBe(0);
		expect(element.style.getPropertyValue("--color-bg")).toBe("");
		expect(element.style.getPropertyValue("--other")).toBe("kept");
	});

	it("works where the window cannot match media queries", () => {
		const element = document.implementation
			.createHTMLDocument()
			.createElement("div");
		const engine = createThemeEngine({ element, meta: DEFAULT_DECK_META });
		expect(engine.motion).toBe(DEFAULT_MOTION_TOKENS);
		expect(() => engine.destroy()).not.toThrow();
	});
});
