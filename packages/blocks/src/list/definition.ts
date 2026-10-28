// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockDefinition,
	type BlockSource,
	createBlockDiagnostic,
	type Diagnostic,
	extractStepAnnotations,
	type InlineNode,
	parseInline,
	type StepDef,
} from "@addondeck/sdk";
import { LIST_MESSAGES } from "./messages";

/** How the items appear: one per step, or all from the start. */
export type ListReveal = "each" | "all";

/** One line of a list. */
export interface ListItem {
	readonly content: readonly InlineNode[];
	/** Nesting depth from the indentation: two spaces or a tab per level. */
	readonly level: number;
	readonly step: StepDef;
}

/** What the list block draws. */
export interface ListModel {
	/** Numbered when the first item starts with a number, such as `1.` or `3)`. */
	readonly ordered: boolean;
	/** Number of the first item of a numbered list. */
	readonly start: number;
	readonly reveal: ListReveal;
	readonly items: readonly ListItem[];
}

const REVEALS: readonly string[] = ["each", "all"] satisfies ListReveal[];
const MARKER = /^(?:[-*+]|(\d{1,9})[.)])(?:[ \t]+|$)/;

function levelOf(text: string): number {
	let width = 0;
	for (const char of text) {
		if (char === " ") width++;
		else if (char === "\t") width += 2;
		else break;
	}
	return Math.floor(width / 2);
}

function readReveal(
	source: BlockSource,
	diagnostics: Diagnostic[],
): ListReveal {
	let reveal: ListReveal = "each";
	for (const option of source.options) {
		if (option.key !== "reveal") {
			diagnostics.push(
				createBlockDiagnostic(LIST_MESSAGES, "LIST-W01", option.location, {
					name: option.name,
				}),
			);
		} else if (REVEALS.includes(option.value.toLowerCase())) {
			reveal = option.value.toLowerCase() as ListReveal;
		} else {
			diagnostics.push(
				createBlockDiagnostic(LIST_MESSAGES, "LIST-W02", option.location, {
					value: option.value,
				}),
			);
		}
	}
	return reveal;
}

/**
 * Items that appear one per step. Each non-blank body line is an item; a
 * leading `-`, `*`, `+` or number marker is optional.
 */
export const definition: BlockDefinition<ListModel> = {
	type: "list",
	aliases: [],
	version: "1.0.0",
	needs: ["animator"],
	parse(source) {
		const diagnostics: Diagnostic[] = source.args.map((name) =>
			createBlockDiagnostic(LIST_MESSAGES, "LIST-W01", source.location, {
				name,
			}),
		);
		const reveal = readReveal(source, diagnostics);
		let start: number | null = null;
		const items: ListItem[] = [];
		for (const line of source.body) {
			if (line.text.trim() === "") continue;
			const result = extractStepAnnotations(line);
			diagnostics.push(...result.diagnostics);
			const { annotation } = result;
			if (annotation !== null && reveal === "all") {
				diagnostics.push(
					createBlockDiagnostic(LIST_MESSAGES, "LIST-W04", annotation.location),
				);
			}
			const text = result.content.trim();
			const marker = MARKER.exec(text);
			if (items.length === 0) {
				start = marker?.[1] === undefined ? null : Number(marker[1]);
			}
			items.push({
				content: parseInline(
					marker === null ? text : text.slice(marker[0].length),
				),
				level: levelOf(line.text),
				step: {
					at: annotation?.step ?? null,
					triggers: annotation?.triggers ?? [],
					location: annotation?.location ?? { line: line.line, column: 1 },
				},
			});
		}
		if (items.length === 0) {
			diagnostics.push(
				createBlockDiagnostic(LIST_MESSAGES, "LIST-W03", source.location),
			);
		}
		return {
			model: { ordered: start !== null, start: start ?? 1, reveal, items },
			diagnostics,
		};
	},
	steps: (model) =>
		model.reveal === "all" ? [] : model.items.map((item) => item.step),
};
