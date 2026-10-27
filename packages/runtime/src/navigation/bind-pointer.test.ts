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
import { bindPointer, SWIPE_DISTANCE } from "./bind-pointer";

let area: HTMLElement;
let actions: { next: Mock<() => void>; prev: Mock<() => void> };
let unbind: () => void;

function pointer(
	type: string,
	x: number,
	y: number,
	init: PointerEventInit = {},
): void {
	area.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			clientX: x,
			clientY: y,
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			...init,
		}),
	);
}

function swipe(dx: number, dy = 0, init: PointerEventInit = {}): void {
	pointer("pointerdown", 200, 200, init);
	pointer("pointerup", 200 + dx, 200 + dy, init);
}

function click(target: EventTarget = area, init: MouseEventInit = {}): void {
	target.dispatchEvent(
		new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
	);
}

beforeEach(() => {
	area = document.createElement("div");
	document.body.append(area);
	actions = { next: vi.fn<() => void>(), prev: vi.fn<() => void>() };
	unbind = bindPointer(area, actions);
});

afterEach(() => {
	unbind();
	document.getSelection()?.removeAllRanges();
	document.body.replaceChildren();
});

describe("bindPointer", () => {
	it("moves forward with a click", () => {
		click();
		expect(actions.next).toHaveBeenCalledOnce();
	});

	it("ignores clicks with other buttons", () => {
		click(area, { button: 1 });
		click(area, { button: 2 });
		expect(actions.next).not.toHaveBeenCalled();
	});

	it("leaves clicks on links and buttons to them", () => {
		const link = document.createElement("a");
		link.href = "#source";
		const label = document.createElement("span");
		link.append(label);
		const button = document.createElement("button");
		area.append(link, button);
		click(label);
		click(button);
		expect(actions.next).not.toHaveBeenCalled();
	});

	it("does not move when a click ends a text selection", () => {
		const text = document.createElement("p");
		text.textContent = "Select me";
		area.append(text);
		const range = document.createRange();
		range.selectNodeContents(text);
		document.getSelection()?.addRange(range);
		click(text);
		expect(actions.next).not.toHaveBeenCalled();
	});

	it("moves forward with a swipe to the left and back with one to the right", () => {
		swipe(-SWIPE_DISTANCE);
		expect(actions.next).toHaveBeenCalledOnce();
		swipe(SWIPE_DISTANCE + 30);
		expect(actions.prev).toHaveBeenCalledOnce();
	});

	it("ignores short and mostly vertical swipes", () => {
		swipe(-(SWIPE_DISTANCE - 1));
		swipe(-80, 120);
		swipe(80, -80);
		expect(actions.next).not.toHaveBeenCalled();
		expect(actions.prev).not.toHaveBeenCalled();
	});

	it("does not count a swipe twice when a click follows it", () => {
		swipe(-120);
		click();
		expect(actions.next).toHaveBeenCalledOnce();
		click();
		expect(actions.next).toHaveBeenCalledTimes(2);
	});

	it("does not treat mouse drags or secondary touches as swipes", () => {
		swipe(-120, 0, { pointerType: "mouse" });
		swipe(-120, 0, { isPrimary: false });
		expect(actions.next).not.toHaveBeenCalled();
	});

	it("forgets a swipe the browser cancelled", () => {
		pointer("pointerdown", 200, 200);
		pointer("pointercancel", 200, 200);
		pointer("pointerup", 20, 200);
		expect(actions.next).not.toHaveBeenCalled();
	});

	it("stops listening when unbound", () => {
		unbind();
		click();
		swipe(-120);
		expect(actions.next).not.toHaveBeenCalled();
	});
});
