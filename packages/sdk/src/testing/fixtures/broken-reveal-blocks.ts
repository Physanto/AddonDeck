// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Variations of the reveal block that each break one rule of the contract, on
// purpose, to check that the suite notices.

import type { BlockInstance } from "../../block/block-instance";
import type { BlockView } from "../../block/block-view";
import type { BlockContractOptions } from "../block-contract-options";
import type { ContractCheckId } from "../contract-check-id";
import {
	drawList,
	REVEAL_DEFINITION,
	REVEAL_DOCS,
	REVEAL_EXAMPLES,
	REVEAL_VIEW,
	type RevealModel,
	showItems,
} from "./reveal-block";

/** The correct reveal block, with everything the suite needs. */
export const REVEAL_OPTIONS: BlockContractOptions<RevealModel> = {
	definition: REVEAL_DEFINITION,
	view: REVEAL_VIEW,
	examples: REVEAL_EXAMPLES,
	docs: REVEAL_DOCS,
	languagePacks: [{ language: "es", blocks: { reveal: ["revelar"] } }],
	translations: { es: null },
};

/** A view built from the drawn list, with only the parts a variation changes. */
function view(
	change: (
		instance: BlockInstance,
		parts: ReturnType<typeof drawList>,
	) => BlockInstance,
): BlockView<RevealModel> {
	return {
		type: "reveal",
		mount(model, el) {
			const parts = drawList(model, el);
			const instance: BlockInstance = {
				setState: (step) => showItems(parts.items, step),
				play: async (_from, to) => showItems(parts.items, to),
				destroy: () => parts.list.remove(),
			};
			return change(instance, parts);
		},
	};
}

const leaked: (() => void)[] = [];

/** Clears what the leaking variations left, once the tests that use them are done. */
export function cleanUpLeaks(): void {
	for (const clean of leaked.splice(0)) clean();
}

/** A block that breaks one rule, and the rule it breaks. */
export interface BrokenBlock {
	readonly breaks: ContractCheckId;
	readonly options: BlockContractOptions<RevealModel>;
}

export const BROKEN_REVEAL_BLOCKS: readonly BrokenBlock[] = [
	{
		breaks: "parse-never-throws",
		options: {
			...REVEAL_OPTIONS,
			definition: {
				...REVEAL_DEFINITION,
				parse(source) {
					if (source.body.length === 0) throw new Error("no lines");
					return REVEAL_DEFINITION.parse(source);
				},
			},
		},
	},
	{
		breaks: "diagnostics-have-lines",
		options: {
			...REVEAL_OPTIONS,
			definition: {
				...REVEAL_DEFINITION,
				parse(source) {
					const result = REVEAL_DEFINITION.parse(source);
					return {
						...result,
						diagnostics: result.diagnostics.map((diagnostic) => ({
							...diagnostic,
							line: 0,
						})),
					};
				},
			},
		},
	},
	{
		breaks: "steps-are-valid",
		options: {
			...REVEAL_OPTIONS,
			definition: {
				...REVEAL_DEFINITION,
				steps: (items) => items.map((item) => ({ ...item.step, at: 0 })),
			},
		},
	},
	{
		breaks: "view-matches-definition",
		options: { ...REVEAL_OPTIONS, view: { ...REVEAL_VIEW, type: "revealed" } },
	},
	{
		breaks: "mount-shows-step-zero",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance, { items }) => {
				showItems(items, items.length);
				return instance;
			}),
		},
	},
	{
		breaks: "set-state-is-idempotent",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance, { list, items }) => {
				let current: number | null = null;
				return {
					...instance,
					setState(step) {
						if (step === current) list.classList.toggle("adk-again");
						current = step;
						showItems(items, step);
					},
				};
			}),
		},
	},
	{
		breaks: "play-matches-set-state",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance, { items }) => ({
				...instance,
				async play(from, to) {
					for (const item of items.slice(from, to)) item.style.opacity = "0.99";
				},
			})),
		},
	},
	{
		breaks: "set-state-goes-back",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance, { items }) => ({
				...instance,
				setState(step) {
					for (const item of items.slice(0, step)) item.style.opacity = "1";
				},
			})),
		},
	},
	{
		breaks: "destroy-cleans-up",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance) => {
				const onKey = (): void => {};
				window.addEventListener("keydown", onKey);
				leaked.push(() => window.removeEventListener("keydown", onKey));
				return instance;
			}),
		},
	},
	{
		breaks: "destroy-cleans-up",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance) => {
				const timer = setInterval(() => {}, 1000);
				leaked.push(() => clearInterval(timer));
				return instance;
			}),
		},
	},
	{
		breaks: "destroy-cleans-up",
		options: {
			...REVEAL_OPTIONS,
			view: view((instance) => ({ ...instance, destroy: () => {} })),
		},
	},
	{
		breaks: "docs-exist",
		options: { ...REVEAL_OPTIONS, docs: "  \n" },
	},
	{
		breaks: "examples-are-valid",
		options: {
			...REVEAL_OPTIONS,
			examples: [
				...REVEAL_EXAMPLES,
				{
					name: "broken.deck",
					source: "format: 1\n\nreveal:\n  One  → nowhere",
				},
			],
		},
	},
	{
		breaks: "translations-exist",
		options: { ...REVEAL_OPTIONS, translations: {} },
	},
];
