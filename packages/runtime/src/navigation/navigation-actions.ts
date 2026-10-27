// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Navigator } from "./create-navigator";

/** What keys, clicks and gestures can ask for. */
export interface NavigationActions
	extends Pick<Navigator, "next" | "prev" | "first" | "last"> {
	toggleFullscreen(): void;
}

const FIELDS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const CONTROLS = `${FIELDS}, a[href], button, summary, label, [role="button"], [role="link"]`;

function closestOf(target: EventTarget | null, selector: string): boolean {
	const node = target as Node | null;
	if (node === null || typeof node.nodeType !== "number") return false;
	const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
	return element?.closest(selector) != null;
}

/** Whether the event happened where typing goes to a form field or editable text. */
export function isInField(target: EventTarget | null): boolean {
	return closestOf(target, FIELDS);
}

/** Whether the event happened on something that handles clicks itself, such as a link. */
export function isOnControl(target: EventTarget | null): boolean {
	return closestOf(target, CONTROLS);
}
