// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Enters full screen with the whole page, or leaves it.
 *
 * Browsers refuse when the request does not come from a user gesture or the
 * page is in a frame without permission; the presentation then stays as it
 * is, so the refusal is ignored.
 */
export function toggleFullscreen(document: Document): void {
	const request =
		document.fullscreenElement == null
			? document.documentElement.requestFullscreen?.()
			: document.exitFullscreen?.();
	request?.catch(() => {});
}
