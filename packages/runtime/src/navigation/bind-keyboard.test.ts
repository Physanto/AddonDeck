// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import { bindKeyboard } from "./bind-keyboard";
import type { NavigationActions } from "./navigation-actions";

let actions: { [K in keyof NavigationActions]: Mock<() => void> };
let unbind: () => void;

function press(
	key: string,
	target: EventTarget = document.body,
	init: KeyboardEventInit = {},
): KeyboardEvent {
	const event = new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
		...init,
	});
	target.dispatchEvent(event);
	return event;
}

function calls(): Record<string, number> {
	return Object.fromEntries(
		Object.entries(actions)
			.map(([name, fn]) => [name, fn.mock.calls.length])
			.filter(([, count]) => count !== 0),
	);
}

beforeEach(() => {
	actions = {
		next: vi.fn<() => void>(),
		prev: vi.fn<() => void>(),
		first: vi.fn<() => void>(),
		last: vi.fn<() => void>(),
		toggleFullscreen: vi.fn<() => void>(),
	};
	unbind = bindKeyboard(document, actions);
});

afterEach(() => {
	unbind();
	document.body.replaceChildren();
});

describe("bindKeyboard", () => {
	it.each([
		["ArrowRight", "next"],
		[" ", "next"],
		["PageDown", "next"],
		["Enter", "next"],
		["ArrowLeft", "prev"],
		["PageUp", "prev"],
		["Backspace", "prev"],
		["Home", "first"],
		["End", "last"],
		["f", "toggleFullscreen"],
		["F", "toggleFullscreen"],
	])("maps %j to %s and keeps the browser from handling it", (key, action) => {
		const event = press(key);
		expect(calls()).toEqual({ [action]: 1 });
		expect(event.defaultPrevented).toBe(true);
	});

	it("ignores other keys", () => {
		const event = press("x");
		press("ArrowUp");
		press("Escape");
		expect(calls()).toEqual({});
		expect(event.defaultPrevented).toBe(false);
	});

	it("leaves shortcuts with Ctrl, Alt or Meta to the browser", () => {
		press("f", document.body, { ctrlKey: true });
		press("ArrowLeft", document.body, { altKey: true });
		press("ArrowRight", document.body, { metaKey: true });
		expect(calls()).toEqual({});
	});

	it("still works with Shift", () => {
		press("F", document.body, { shiftKey: true });
		press(" ", document.body, { shiftKey: true });
		expect(calls()).toEqual({ toggleFullscreen: 1, next: 1 });
	});

	it("ignores keys typed in form fields and editable text", () => {
		const input = document.createElement("input");
		const editable = document.createElement("div");
		editable.contentEditable = "true";
		const inner = document.createElement("span");
		editable.append(inner);
		document.body.append(input, editable);
		press("ArrowRight", input);
		press("Backspace", input);
		press(" ", inner);
		expect(calls()).toEqual({});
	});

	it("lets Enter and Space activate a focused link or button", () => {
		const button = document.createElement("button");
		const link = document.createElement("a");
		link.href = "#credits";
		document.body.append(button, link);
		press("Enter", button);
		press(" ", link);
		press("ArrowRight", button);
		expect(calls()).toEqual({ next: 1 });
	});

	it("ignores keys another handler already took", () => {
		document.body.addEventListener(
			"keydown",
			(event) => event.preventDefault(),
			{ once: true },
		);
		press("ArrowRight");
		expect(calls()).toEqual({});
	});

	it("stops listening when unbound", () => {
		unbind();
		press("ArrowRight");
		expect(calls()).toEqual({});
	});
});
