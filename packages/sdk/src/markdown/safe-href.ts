// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const ALLOWED = /^(?:https?:\/\/|mailto:|#)/i;

/**
 * The destination of a Markdown link, when a deck may link to it: web and
 * email addresses and fragments of the page. Deck text is never executed, so
 * `javascript:` and every other scheme are refused.
 *
 * @returns The trimmed destination, or `null` when it is not allowed.
 */
export function safeHref(destination: string): string | null {
	const href = destination.trim();
	return ALLOWED.test(href) ? href : null;
}
