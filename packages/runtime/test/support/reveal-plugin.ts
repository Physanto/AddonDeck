// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockPlugin, StepDef } from "@addondeck/sdk";

/** Model of the test block: one item per body line. */
export interface RevealModel {
	readonly items: readonly string[];
}

/**
 * A block for tests, `reveal:`, that shows one more item of its list in each
 * step. It animates through the context's animator, as real blocks do.
 */
export function createRevealPlugin(): BlockPlugin<RevealModel> {
	return {
		kind: "block",
		definition: {
			type: "reveal",
			aliases: [],
			version: "1.0.0",
			parse: (source) => ({
				model: { items: source.body.map((line) => line.text) },
				diagnostics: [],
			}),
			steps: (model) =>
				model.items.map(
					(): StepDef => ({ at: null, triggers: [], location: null }),
				),
		},
		view: {
			type: "reveal",
			mount(model, el, ctx) {
				const list = el.ownerDocument.createElement("ol");
				const items = model.items.map((text) => {
					const item = el.ownerDocument.createElement("li");
					item.textContent = text;
					list.append(item);
					return item;
				});
				const show = (step: number): void => {
					items.forEach((item, index) => {
						item.style.opacity = index < step ? "1" : "0";
					});
				};
				show(0);
				el.append(list);
				return {
					setState: show,
					play(from, to) {
						const timeline = ctx.animator.timeline();
						for (const item of items.slice(from, to)) {
							timeline.add(item, { opacity: [0, 1] });
						}
						return timeline.finished;
					},
					destroy: () => list.remove(),
				};
			},
		},
	};
}
