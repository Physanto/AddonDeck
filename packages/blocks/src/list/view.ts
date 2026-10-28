// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockView,
	playReveal,
	renderInline,
	setRevealed,
} from "@addondeck/sdk";
import type { ListModel } from "./definition";

/**
 * Draws the items as one flat list, indented by level. In a numbered list
 * only the top level is numbered.
 */
export const view: BlockView<ListModel> = {
	type: "list",
	mount(model, el, ctx) {
		const document = el.ownerDocument;
		const list = document.createElement(model.ordered ? "ol" : "ul");
		list.className = "adk-list";
		let number = model.start;
		const items = model.items.map((item) => {
			const entry = document.createElement("li");
			entry.dataset.level = String(item.level);
			if (model.ordered && item.level === 0) entry.value = number++;
			renderInline(item.content, entry);
			return entry;
		});
		list.append(...items);
		el.append(list);

		const stepped = model.reveal === "each" ? items : [];
		const setState = (step: number): void => {
			stepped.forEach((item, index) => {
				setRevealed(ctx.animator, [item], index < step);
			});
		};
		setState(0);

		return {
			setState,
			play: (from, to) => playReveal(ctx, stepped.slice(from, to)),
			destroy() {
				list.remove();
			},
		};
	},
};
