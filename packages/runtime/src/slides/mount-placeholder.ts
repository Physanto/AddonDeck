// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "@addondeck/core";

/** What a placeholder shows instead of a block. */
export interface Placeholder {
	/** The block type, shown as a label. */
	readonly type: string;
	/** The deck text of the content, as written. */
	readonly lines: readonly string[];
	/** Why the block is missing, when it is a problem. */
	readonly error?: string;
}

/**
 * Shows a marker with the block type and its text, for content whose block
 * cannot be drawn: the block is not available yet or it failed.
 */
export function mountPlaceholder(
	el: HTMLElement,
	placeholder: Placeholder,
): void {
	const document = el.ownerDocument;
	const marker = document.createElement("div");
	marker.className = "adk-placeholder";
	marker.dataset.type = placeholder.type;
	const label = document.createElement("span");
	label.className = "adk-placeholder-type";
	label.textContent = placeholder.type;
	const source = document.createElement("pre");
	source.className = "adk-placeholder-source";
	source.textContent = placeholder.lines.join("\n");
	marker.append(label, source);
	if (placeholder.error !== undefined) {
		marker.dataset.error = "";
		const message = document.createElement("p");
		message.className = "adk-placeholder-message";
		message.textContent = placeholder.error;
		marker.append(message);
	}
	el.replaceChildren(marker);
}

/** The text of source lines, as written. */
export function rawLines(lines: readonly SourceLine[]): string[] {
	return lines.map((line) => line.raw);
}
