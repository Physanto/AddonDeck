// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Unsubscribe } from "@addondeck/sdk";
import { isOnControl, type NavigationActions } from "./navigation-actions";

/** Shortest horizontal movement, in screen pixels, that counts as a swipe. */
export const SWIPE_DISTANCE = 50;

interface Touch {
	readonly id: number;
	readonly x: number;
	readonly y: number;
}

/**
 * Navigates with clicks and swipes on `area`.
 *
 * A click or a tap plays the next click of the slide. Swiping to the left
 * moves forward and swiping to the right moves back; a swipe must be more
 * horizontal than vertical, so vertical scrolling is left alone. Clicks on
 * links and buttons, or that end a text selection, are ignored.
 *
 * @returns A function that stops listening.
 */
export function bindPointer(
	area: HTMLElement,
	actions: Pick<NavigationActions, "next" | "prev">,
): Unsubscribe {
	let touch: Touch | null = null;
	let swiped = false;

	const onPointerDown = (event: PointerEvent): void => {
		swiped = false;
		touch =
			event.pointerType === "mouse" || !event.isPrimary
				? null
				: { id: event.pointerId, x: event.clientX, y: event.clientY };
	};
	const onPointerUp = (event: PointerEvent): void => {
		if (touch === null || touch.id !== event.pointerId) return;
		const dx = event.clientX - touch.x;
		const dy = event.clientY - touch.y;
		touch = null;
		if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return;
		// Some browsers still send a click after a short swipe.
		swiped = true;
		if (dx < 0) actions.next();
		else actions.prev();
	};
	const onPointerCancel = (): void => {
		touch = null;
	};
	const onClick = (event: MouseEvent): void => {
		if (swiped) {
			swiped = false;
			return;
		}
		if (event.button !== 0 || event.defaultPrevented) return;
		if (isOnControl(event.target)) return;
		const selection = area.ownerDocument.getSelection();
		if (selection !== null && !selection.isCollapsed) return;
		actions.next();
	};

	area.addEventListener("pointerdown", onPointerDown);
	area.addEventListener("pointerup", onPointerUp);
	area.addEventListener("pointercancel", onPointerCancel);
	area.addEventListener("click", onClick);
	return () => {
		area.removeEventListener("pointerdown", onPointerDown);
		area.removeEventListener("pointerup", onPointerUp);
		area.removeEventListener("pointercancel", onPointerCancel);
		area.removeEventListener("click", onClick);
	};
}
