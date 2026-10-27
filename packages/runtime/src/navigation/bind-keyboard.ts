// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Unsubscribe } from "@addondeck/sdk";
import {
	isInField,
	isOnControl,
	type NavigationActions,
} from "./navigation-actions";

type Action = keyof NavigationActions;

/**
 * Keys by `KeyboardEvent.key`. Wireless presenters send PageUp and PageDown,
 * or the arrow keys.
 */
const KEY_ACTIONS: ReadonlyMap<string, Action> = new Map<string, Action>([
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
]);

/** Enter and Space also activate a focused link or button, which wins. */
const ACTIVATION_KEYS = new Set(["Enter", " "]);

/**
 * Navigates with the keyboard.
 *
 * Keys pressed with Ctrl, Alt or Meta are left to the browser, and so is
 * typing in a form field, so shortcuts such as Ctrl+F keep working.
 *
 * @param target - Where to listen, usually the document.
 * @returns A function that stops listening.
 */
export function bindKeyboard(
	target: EventTarget,
	actions: NavigationActions,
): Unsubscribe {
	const onKeyDown = (event: Event): void => {
		const key = event as KeyboardEvent;
		if (key.defaultPrevented || key.isComposing) return;
		if (key.ctrlKey || key.altKey || key.metaKey) return;
		const action = KEY_ACTIONS.get(key.key);
		if (action === undefined || isInField(key.target)) return;
		if (ACTIVATION_KEYS.has(key.key) && isOnControl(key.target)) return;
		// Space and Backspace would otherwise scroll or go back in the history.
		key.preventDefault();
		actions[action]();
	};
	target.addEventListener("keydown", onKeyDown);
	return () => target.removeEventListener("keydown", onKeyDown);
}
