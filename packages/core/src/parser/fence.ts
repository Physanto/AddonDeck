// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** An open Markdown code fence. */
export interface Fence {
	readonly marker: "`" | "~";
	readonly length: number;
}

const MAX_FENCE_INDENT = 3;
const MIN_FENCE_LENGTH = 3;

/**
 * Reads a Markdown fence opener: three or more backticks or tildes, indented
 * at most three spaces. A backtick fence may not have backticks in its info string.
 */
export function readFence(line: string): Fence | null {
	const rest = line.trimStart();
	const indent = line.slice(0, line.length - rest.length);
	if (indent.length > MAX_FENCE_INDENT || indent.includes("\t")) return null;

	const marker = rest[0];
	if (marker !== "`" && marker !== "~") return null;
	let length = 0;
	while (rest[length] === marker) length++;
	if (length < MIN_FENCE_LENGTH) return null;
	if (marker === "`" && rest.slice(length).includes("`")) return null;
	return { marker, length };
}

/** Whether a line closes a fence: the same marker, at least as long, and nothing else. */
export function closesFence(fence: Fence, line: string): boolean {
	const closing = readFence(line);
	return (
		closing !== null &&
		closing.marker === fence.marker &&
		closing.length >= fence.length &&
		line.trim() === fence.marker.repeat(closing.length)
	);
}
