// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { PartialDiagnosticMessages } from "../diagnostics/diagnostic-messages";
import { sortByPosition } from "../diagnostics/sort-by-position";
import type { Slide } from "../model/slide";
import { createReporter, type Reporter } from "../parser/reporter";
import type { BlockRegistry } from "../registry/block-registry";
import type { Participant } from "./participant";
import { placeSteps } from "./place-steps";
import { readBlockSteps } from "./read-block-steps";
import { readTextSteps } from "./read-text-steps";
import type { StepAdvance, StepPlan } from "./step-plan";

/** Optional parts of {@link compileStepPlan}. */
export interface CompileStepPlanOptions {
	/** Messages of the active language. Missing ones fall back to English. */
	readonly messages?: PartialDiagnosticMessages;
}

function readParticipants(
	slide: Slide,
	registry: BlockRegistry,
	reporter: Reporter,
): Participant[] {
	return slide.content.map((node, index) => {
		if (node.kind === "text") {
			return { node: index, id: null, steps: readTextSteps(node) };
		}
		const definition = registry.resolve(node.type);
		return {
			node: index,
			id: node.id,
			steps:
				definition === undefined
					? []
					: readBlockSteps(node, definition, reporter),
		};
	});
}

/**
 * Compiles the step plan of a slide: which text and blocks advance in each click.
 *
 * Steps follow the order of appearance, `@n` moves a step to click `n`, and
 * `→ id` plays a step of block `id` in the same click; the format
 * specification describes how they combine. Clicks in which nothing would
 * change are removed, so `@1` and `@5` alone make two clicks. Like the parser,
 * it never throws: a block whose `steps` fails offers no steps (`E201`).
 *
 * Arrows of text lines naming no block were reported by the parser; this
 * function reports `E204` only for arrows of block steps.
 *
 * @param slide - A slide of a parsed deck.
 * @param registry - The registry the deck was parsed with.
 * @param options - Message catalog for the diagnostics.
 * @returns The clicks of the slide and the diagnostics found while placing them.
 *
 * @example
 * ```ts
 * // code id=client:  line @1 → network, line @2 → network, line @3
 * // sequence id=network: two messages
 * compileStepPlan(slide, registry).clicks;
 * // [
 * //   [{ node: 0, from: 0, to: 1 }, { node: 1, from: 0, to: 1 }],
 * //   [{ node: 0, from: 1, to: 2 }, { node: 1, from: 1, to: 2 }],
 * //   [{ node: 0, from: 2, to: 3 }],
 * // ]
 * ```
 */
export function compileStepPlan(
	slide: Slide,
	registry: BlockRegistry,
	options: CompileStepPlanOptions = {},
): StepPlan {
	const reporter = createReporter(options.messages);
	const participants = readParticipants(slide, registry, reporter);

	const ids = new Set<string>();
	for (const node of slide.content) {
		if (node.kind === "block" && node.id !== null) ids.add(node.id);
	}
	for (const { steps } of participants) {
		for (const { triggers } of steps) {
			for (const trigger of triggers) {
				if (trigger.reportUnknown && !ids.has(trigger.id)) {
					reporter.report("E204", trigger.location, { id: trigger.id });
				}
			}
		}
	}

	const slots = placeSteps(participants, reporter);
	const used = [...new Set(slots.flat())].sort((a, b) => a - b);
	const clickOf = new Map(used.map((slot, click) => [slot, click]));
	const clicks = used.map((): StepAdvance[] => []);
	participants.forEach(({ node }, participant) => {
		const own = slots[participant] ?? [];
		let from = 0;
		while (from < own.length) {
			const slot = own[from] as number;
			let to = from + 1;
			while (own[to] === slot) to++;
			clicks[clickOf.get(slot) as number]?.push({ node, from, to });
			from = to;
		}
	});
	return { clicks, diagnostics: sortByPosition(reporter.diagnostics) };
}
