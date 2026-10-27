// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Unsubscribe } from "@addondeck/sdk";
import type { Navigator } from "./create-navigator";
import { formatDeckHash, parseDeckHash } from "./deck-hash";

/**
 * Keeps the address hash and the position in step, in both directions: the
 * hash opens a position, and every move rewrites the hash.
 *
 * The hash is replaced instead of pushed, so the browser's back button leaves
 * the deck instead of undoing each click. Changing only the hash keeps
 * working for a file opened from the disk, where the History API may refuse
 * to change the address.
 *
 * @returns A function that stops following the hash.
 */
export function bindHash(window: Window, navigator: Navigator): Unsubscribe {
	const { location } = window;
	const follow = (): void => {
		const position = parseDeckHash(location.hash);
		if (position !== null) navigator.goTo(position);
	};
	const write = (): void => {
		const hash = formatDeckHash(navigator.position);
		if (location.hash !== hash) location.replace(hash);
	};

	follow();
	write();
	const unsubscribe = navigator.subscribe(write);
	window.addEventListener("hashchange", follow);
	return () => {
		unsubscribe();
		window.removeEventListener("hashchange", follow);
	};
}
