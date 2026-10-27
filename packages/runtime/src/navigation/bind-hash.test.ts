// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindHash } from "./bind-hash";
import { createNavigator } from "./create-navigator";

/** Changes the hash as typing it in the address bar would. */
function typeHash(hash: string): void {
	location.hash = hash;
	window.dispatchEvent(new HashChangeEvent("hashchange"));
}

beforeEach(() => {
	location.hash = "";
});

let unbind: (() => void) | null = null;
afterEach(() => {
	unbind?.();
	unbind = null;
});

describe("bindHash", () => {
	it("opens the position in the hash", () => {
		location.hash = "#/3/2";
		const navigator = createNavigator([0, 0, 2]);
		unbind = bindHash(window, navigator);
		expect(navigator.position).toEqual({ slide: 2, step: 1 });
	});

	it("writes the starting position when the hash has none", () => {
		const navigator = createNavigator([0, 0]);
		unbind = bindHash(window, navigator);
		expect(location.hash).toBe("#/1");
	});

	it("rewrites a position out of range as the closest one", () => {
		location.hash = "#/9/9";
		const navigator = createNavigator([0, 2]);
		unbind = bindHash(window, navigator);
		expect(location.hash).toBe("#/2/3");
	});

	it("rewrites the hash after every move without adding history entries", () => {
		const navigator = createNavigator([1, 0]);
		unbind = bindHash(window, navigator);
		// The test DOM adds an entry on replace too, so the call is checked instead.
		const replace = vi.spyOn(location, "replace");
		navigator.next();
		expect(location.hash).toBe("#/1/2");
		navigator.next();
		expect(location.hash).toBe("#/2");
		expect(replace.mock.calls).toEqual([["#/1/2"], ["#/2"]]);
		replace.mockRestore();
	});

	it("follows the hash when it changes", () => {
		const navigator = createNavigator([0, 3, 0]);
		unbind = bindHash(window, navigator);
		typeHash("#/2/3");
		expect(navigator.position).toEqual({ slide: 1, step: 2 });
	});

	it("ignores a hash that is not a position", () => {
		const navigator = createNavigator([0, 0], { slide: 1, step: 0 });
		unbind = bindHash(window, navigator);
		typeHash("#credits");
		expect(navigator.position).toEqual({ slide: 1, step: 0 });
	});

	it("stops following the hash when unbound", () => {
		const navigator = createNavigator([0, 0]);
		unbind = bindHash(window, navigator);
		unbind();
		typeHash("#/2");
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
		navigator.next();
		expect(location.hash).toBe("#/2");
	});
});
