// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockView,
	playReveal,
	renderMarkdown,
	setRevealed,
} from "@addondeck/sdk";
import type { TextModel } from "./definition";

function present(element: HTMLElement | undefined): element is HTMLElement {
	return element !== undefined;
}

/**
 * Draws the Markdown. Step `n` shows the first `n` annotated lines; each
 * annotated line hides its heading, list item or line of a paragraph.
 */
export const view: BlockView<TextModel> = {
	type: "text",
	mount(model, el, ctx) {
		const root = el.ownerDocument.createElement("div");
		root.className = "adk-text";
		const { lines } = renderMarkdown(model.markdown, root);
		const steps = model.markdown.annotated.map(({ line }) => lines.get(line));
		el.append(root);

		const setState = (step: number): void => {
			steps.forEach((element, index) => {
				if (element !== undefined) {
					setRevealed(ctx.animator, [element], index < step);
				}
			});
		};
		setState(0);

		return {
			setState,
			play: (from, to) =>
				playReveal(ctx, steps.slice(from, to).filter(present)),
			destroy() {
				root.remove();
			},
		};
	},
};
