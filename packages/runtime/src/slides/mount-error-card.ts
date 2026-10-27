// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { RuntimeIssue } from "../issues/runtime-issue";

/**
 * Shows the problems of a slide in a card over its corner.
 *
 * The card can be folded so the slide shows through, and its summary is a
 * control: clicking it does not move to the next click.
 *
 * @param title - The card's summary, such as "2 problems on this slide".
 */
export function mountErrorCard(
	slide: HTMLElement,
	problems: readonly RuntimeIssue[],
	title: string,
): HTMLElement {
	const document = slide.ownerDocument;
	const card = document.createElement("aside");
	card.className = "adk-error-card";
	const details = document.createElement("details");
	details.open = true;
	const summary = document.createElement("summary");
	summary.textContent = title;
	const list = document.createElement("ul");
	for (const problem of problems) {
		const item = document.createElement("li");
		item.dataset.severity = problem.severity;
		item.textContent = problem.message;
		list.append(item);
	}
	details.append(summary, list);
	card.append(details);
	slide.append(card);
	return card;
}
