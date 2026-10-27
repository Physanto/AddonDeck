// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createTestRegistry } from "../../test/support/test-registry";
import { parse } from "../parser/parse";
import { compileStepPlan } from "./compile-step-plan";

const registry = createTestRegistry();
const RUNS = { numRuns: 1000 };

/** Slides made of blocks with steps, arrows between them and pinned steps. */
const slideLine = fc.oneof(
	fc.constantFrom(
		"",
		"---",
		"reveal id=a:",
		"reveal id=b:",
		"reveal:",
		"sequence id=c:",
		"explode:",
		"- text",
		"```",
	),
	fc
		.tuple(
			fc.constantFrom("  ", "- "),
			fc.option(fc.integer({ min: -1, max: 6 }), { nil: undefined }),
			fc.array(fc.constantFrom("a", "b", "c", "d"), { maxLength: 3 }),
		)
		.map(([start, step, ids]) => {
			const annotation = [
				...(step === undefined ? [] : [`@${step}`]),
				...ids.map((id) => `→ ${id}`),
			].join(" ");
			return `${start}line  ${annotation}`;
		}),
);

const deckText = fc
	.array(slideLine, { maxLength: 30 })
	.map((lines) => lines.join("\n"));

describe("compileStepPlan properties", () => {
	it("plays every step of every node exactly once and in order", () => {
		fc.assert(
			fc.property(deckText, (text) => {
				const { deck } = parse(text, { registry });
				for (const slide of deck.slides) {
					const played = new Map<number, number>();
					for (const click of compileStepPlan(slide, registry).clicks) {
						expect(click.length).toBeGreaterThan(0);
						for (const { node, from, to } of click) {
							expect(from).toBe(played.get(node) ?? 0);
							expect(to).toBeGreaterThan(from);
							played.set(node, to);
						}
					}
					slide.content.forEach((node, index) => {
						if (node.kind !== "block" || node.model === null) return;
						const steps = registry.resolve(node.type)?.steps(node.model) ?? [];
						expect(played.get(index) ?? 0).toBe(steps.length);
					});
				}
			}),
			RUNS,
		);
	});

	it("is deterministic", () => {
		fc.assert(
			fc.property(deckText, (text) => {
				const { deck } = parse(text, { registry });
				for (const slide of deck.slides) {
					expect(compileStepPlan(slide, registry)).toEqual(
						compileStepPlan(slide, registry),
					);
				}
			}),
			RUNS,
		);
	});
});
