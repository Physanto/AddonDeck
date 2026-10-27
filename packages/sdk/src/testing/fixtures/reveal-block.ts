// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// A minimal block that follows the whole contract, used to test the suite.
// It shows one item per body line, revealing one more in each step.

import {
	type BlockDefinition,
	type Diagnostic,
	extractStepAnnotations,
	type StepDef,
} from "@addondeck/core";
import type { BlockInstance } from "../../block/block-instance";
import type { BlockView } from "../../block/block-view";
import type { BlockExample } from "../block-contract-options";

/** One item of a reveal block. */
export interface RevealItem {
	readonly text: string;
	readonly step: StepDef;
}

/** The model of a reveal block: its items in order. */
export type RevealModel = readonly RevealItem[];

export const REVEAL_DEFINITION: BlockDefinition<RevealModel> = {
	type: "reveal",
	aliases: ["uncover"],
	version: "1.0.0",
	parse(source) {
		const diagnostics: Diagnostic[] = [];
		const items = source.body
			.filter((line) => line.text.trim() !== "")
			.map((line): RevealItem => {
				const { content, annotation } = extractStepAnnotations(line);
				return {
					text: content.trim(),
					step: {
						at: annotation?.step ?? null,
						triggers: annotation?.triggers ?? [],
						location: annotation?.location ?? { line: line.line, column: 1 },
					},
				};
			});
		if (items.length === 0) {
			diagnostics.push({
				severity: "warning",
				code: "REVEAL1",
				line: source.location.line,
				column: 1,
				message: "The reveal block has no items.",
				params: {},
			});
		}
		return { model: items, diagnostics };
	},
	steps: (items) => items.map((item) => item.step),
};

/** Shows the items revealed after `step` steps. */
export function showItems(items: readonly HTMLElement[], step: number): void {
	items.forEach((item, index) => {
		item.style.opacity = index < step ? "1" : "0";
	});
}

/** Draws the list; shared by the correct view and the broken ones. */
export function drawList(
	model: RevealModel,
	el: HTMLElement,
): {
	readonly list: HTMLUListElement;
	readonly items: HTMLLIElement[];
} {
	const list = document.createElement("ul");
	list.className = "adk-reveal";
	const items = model.map((item) => {
		const entry = document.createElement("li");
		entry.textContent = item.text;
		return entry;
	});
	list.append(...items);
	el.append(list);
	showItems(items, 0);
	return { list, items };
}

export const REVEAL_VIEW: BlockView<RevealModel> = {
	type: "reveal",
	mount(model, el, ctx): BlockInstance {
		const { list, items } = drawList(model, el);
		const onClick = (): void => ctx.events.emit("reveal:click");
		list.addEventListener("click", onClick);
		const onResize = (): void => {};
		window.addEventListener("resize", onResize, { passive: true });
		const off = ctx.events.on("reveal:reset", () => showItems(items, 0));
		return {
			setState: (step) => showItems(items, step),
			async play(from, to) {
				await ctx.animator.animate(
					items.slice(from, to),
					{ opacity: [0, 1] },
					{ duration: ctx.motion.duration.m, easing: ctx.motion.easing.enter },
				).finished;
			},
			destroy() {
				list.removeEventListener("click", onClick);
				window.removeEventListener("resize", onResize);
				off();
				list.remove();
			},
		};
	},
};

export const REVEAL_DOCS = `# reveal

Shows one item per line, revealing one more in each step.

\`\`\`
reveal:
  First
  Second
\`\`\`
`;

export const REVEAL_EXAMPLES: readonly BlockExample[] = [
	{
		name: "reveal.deck",
		source: [
			"format: 1",
			"",
			"# Reveal",
			"",
			"reveal id=list:",
			"  First",
			"  Second  @3",
			"  Third",
			"",
			"- Shown with the first item  → list",
		].join("\n"),
	},
	{
		name: "single.deck",
		source: "format: 1\n\nuncover:\n  Only one",
	},
];
