// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SlideLayout, SlideNode } from "@addondeck/core";

/** How the body of a slide places its content. */
export type SlideFlow = "single" | "columns" | "rows";

/** Which content goes where on a slide, by index in `slide.content`. */
export interface SlideArrangement {
	/** Text that leads the slide, such as its title, or `null`. */
	readonly header: number | null;
	/** The rest of the content, in order. */
	readonly body: readonly number[];
	readonly flow: SlideFlow;
}

/**
 * Decides where each piece of a slide goes. The stylesheet does the geometry.
 *
 * Text followed by more content becomes the header. With `layout=auto`, the
 * body shows one piece filling the slide, two side by side, and more stacked
 * in rows; `columns` and `rows` choose the flow whatever the count.
 *
 * @example
 * ```ts
 * arrangeSlide([title, chart, table], "auto");
 * // { header: 0, body: [1, 2], flow: "columns" }
 * ```
 */
export function arrangeSlide(
	content: readonly SlideNode[],
	layout: SlideLayout,
): SlideArrangement {
	const header = content.length > 1 && content[0]?.kind === "text" ? 0 : null;
	const body = content
		.map((_, index) => index)
		.filter((index) => index !== header);
	if (layout === "columns" || layout === "rows") {
		return { header, body, flow: layout };
	}
	const flow =
		body.length <= 1 ? "single" : body.length === 2 ? "columns" : "rows";
	return { header, body, flow };
}
