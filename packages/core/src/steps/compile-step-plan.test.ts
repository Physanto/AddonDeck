// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { extractStepAnnotations } from "../annotations/extract-step-annotations";
import type { BlockDefinition } from "../contracts/block-definition";
import type { StepDef } from "../contracts/step-def";
import type { SourceLine } from "../model/source-line";
import { parse } from "../parser/parse";
import type { BlockRegistry } from "../registry/block-registry";
import { createBlockRegistry } from "../registry/create-block-registry";
import { compileStepPlan } from "./compile-step-plan";
import type { StepPlan } from "./step-plan";

/** One step per non-blank body line, with the line's annotation. */
const REVEAL: BlockDefinition<readonly SourceLine[]> = {
	type: "reveal",
	aliases: [],
	version: "0.0.0",
	parse: (source) => ({
		model: source.body.filter((line) => line.text.trim() !== ""),
		diagnostics: [],
	}),
	steps: (lines) =>
		lines.map((line): StepDef => {
			const { annotation } = extractStepAnnotations(line);
			return {
				at: annotation?.step ?? null,
				triggers: annotation?.triggers ?? [],
				location: annotation?.location ?? { line: line.line, column: 1 },
			};
		}),
};

/** A block whose steps are whatever the test gives, ignoring its body. */
function probe(steps: () => unknown): BlockDefinition {
	return {
		type: "probe",
		aliases: [],
		version: "0.0.0",
		parse: () => ({ model: true, diagnostics: [] }),
		steps: steps as BlockDefinition["steps"],
	};
}

function planOf(
	source: string,
	registry: BlockRegistry = createBlockRegistry([REVEAL]),
	planRegistry: BlockRegistry = registry,
): StepPlan {
	const { deck } = parse(`format: 1\n\n${source}`, { registry });
	const slide = deck.slides[0];
	if (slide === undefined) throw new Error("The deck has no slide");
	return compileStepPlan(slide, planRegistry);
}

/** The plan as `node:from-to` strings, one list per click. */
function clicksOf(plan: StepPlan): string[][] {
	return plan.clicks.map((click) =>
		click.map(({ node, from, to }) => `${node}:${from}-${to}`),
	);
}

function codesOf(plan: StepPlan): string[] {
	return plan.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("compileStepPlan", () => {
	describe("default order", () => {
		it("plays the steps of each block before the next block", () => {
			const plan = planOf("reveal:\n  a\n  b\n\nreveal:\n  c");
			expect(clicksOf(plan)).toEqual([["0:0-1"], ["0:1-2"], ["1:0-1"]]);
			expect(plan.diagnostics).toEqual([]);
		});

		it("gives a slide without steps no clicks", () => {
			expect(planOf("# Only text\n\nMore text").clicks).toEqual([]);
		});

		it("gives text a step only for annotated lines", () => {
			const plan = planOf("- first\n- second  → x\n\nreveal id=x:\n  a\n  b");
			expect(clicksOf(plan)).toEqual([["0:0-1", "1:0-1"], ["1:1-2"]]);
		});

		it("reads no annotations inside code fences", () => {
			const plan = planOf("```\nprint(1)  @1\n```\n- shown  @2");
			expect(clicksOf(plan)).toEqual([["0:0-1"]]);
		});

		it("offers no steps for blocks shown as text or missing from the registry", () => {
			const failing = probe(() => {
				throw new Error("no steps");
			});
			expect(
				planOf("probe:\n  a", createBlockRegistry([failing])).clicks,
			).toEqual([]);
			expect(
				planOf(
					"reveal:\n  a",
					createBlockRegistry([REVEAL]),
					createBlockRegistry([]),
				).clicks,
			).toEqual([]);
		});
	});

	describe("@n", () => {
		it("joins steps of different content in the same click", () => {
			const plan = planOf("reveal:\n  a\n  b\n\n- one  @1\n- two  @2");
			expect(clicksOf(plan)).toEqual([
				["0:0-1", "1:0-1"],
				["0:1-2", "1:1-2"],
			]);
		});

		it("continues the default order after the highest click used", () => {
			const plan = planOf("- late  @2\n\nreveal:\n  a\n  b");
			expect(clicksOf(plan)).toEqual([["0:0-1"], ["1:0-1"], ["1:1-2"]]);
		});

		it("removes clicks in which nothing changes", () => {
			const plan = planOf("- one  @1\n- five  @5\n- nine  @9");
			expect(clicksOf(plan)).toEqual([["0:0-1"], ["0:1-2"], ["0:2-3"]]);
		});

		it("plays several steps of a block in one click", () => {
			const plan = planOf("reveal:\n  a  @1\n  b  @1\n  c  @2");
			expect(clicksOf(plan)).toEqual([["0:0-2"], ["0:2-3"]]);
		});

		it("warns about a step placed before an earlier step of its block", () => {
			const plan = planOf("reveal:\n  a  @2\n  b  @1");
			expect(clicksOf(plan)).toEqual([["0:0-2"]]);
			expect(plan.diagnostics).toMatchObject([
				{ code: "W315", line: 5, column: 6 },
			]);
		});
	});

	describe("→ id", () => {
		it("plays the example of the format specification in three clicks", () => {
			const plan = planOf(
				[
					"reveal id=client:",
					"  r = post()      @1 → network",
					"  if r.ok:        @2 → network",
					"    print(1)      @3",
					"",
					"reveal id=network:",
					"  Client -> Server: POST",
					"  Server --> Client: 200",
				].join("\n"),
			);
			expect(clicksOf(plan)).toEqual([
				["0:0-1", "1:0-1"],
				["0:1-2", "1:1-2"],
				["0:2-3"],
			]);
		});

		it("plays the steps no arrow names in the default order", () => {
			const plan = planOf("- go  → net\n\nreveal id=net:\n  a  @7\n  b\n  c");
			expect(clicksOf(plan)).toEqual([
				["0:0-1", "1:0-1"],
				["1:1-2"],
				["1:2-3"],
			]);
		});

		it("continues a block written before its arrows right after the last one", () => {
			const plan = planOf(
				"reveal id=net:\n  a\n  b\n  c\n\n- one  @1 → net\n- two  @2 → net\n- three  @3",
			);
			expect(clicksOf(plan)).toEqual([
				["0:0-1", "1:0-1"],
				["0:1-2", "1:1-2"],
				["0:2-3", "1:2-3"],
			]);
		});

		it("ignores arrows beyond the steps of the block they name", () => {
			const plan = planOf("- one  → x\n- two  → x\n\nreveal id=x:\n  a");
			expect(clicksOf(plan)).toEqual([["0:0-1", "1:0-1"], ["0:1-2"]]);
		});

		it("lets an arrow follow a chain of blocks", () => {
			const plan = planOf(
				"- go  → a\n\nreveal id=a:\n  x  → b\n\nreveal id=b:\n  y",
			);
			expect(clicksOf(plan)).toEqual([["0:0-1", "1:0-1", "2:0-1"]]);
		});

		it("warns when arrows would play a block out of order", () => {
			const plan = planOf(
				"- late  @2 → x\n\nreveal:\n  a  @1 → x\n\nreveal id=x:\n  b\n  c",
			);
			expect(clicksOf(plan)).toEqual([["1:0-1"], ["0:0-1", "2:0-2"]]);
			expect(plan.diagnostics).toMatchObject([
				{ code: "W315", line: 6, column: 6 },
			]);
		});

		it("places steps that wait for each other in a cycle at the end", () => {
			const plan = planOf(
				"reveal id=a:\n  x  → b\n\nreveal id=b:\n  y  → a\n\nreveal:\n  z",
			);
			expect(clicksOf(plan)).toEqual([["2:0-1"], ["0:0-1", "1:0-1"]]);
		});

		it("plays a block that names itself in the default order", () => {
			const plan = planOf("reveal id=a:\n  x  → a\n  y\n  z");
			expect(clicksOf(plan)).toEqual([["0:0-1"], ["0:1-2"], ["0:2-3"]]);
		});

		it("reports arrows of block steps that name no block on the slide", () => {
			const plan = planOf("reveal:\n  a  → nowhere");
			expect(plan.diagnostics).toMatchObject([
				{ code: "E204", line: 4, params: { id: "nowhere" } },
			]);
			expect(clicksOf(plan)).toEqual([["0:0-1"]]);
		});

		it("leaves arrows of text lines to the parser", () => {
			expect(codesOf(planOf("- go  → nowhere"))).toEqual([]);
		});

		it("accepts an arrow to a block that offers no steps", () => {
			const plan = planOf("- go  → x\n\nreveal id=x:");
			expect(clicksOf(plan)).toEqual([["0:0-1"]]);
			expect(plan.diagnostics).toEqual([]);
		});
	});

	describe("blocks that break the contract", () => {
		it("turns steps that throw while planning into E201", () => {
			let calls = 0;
			const flaky = probe(() => {
				calls++;
				if (calls > 1) throw new Error("not twice");
				return [];
			});
			const plan = planOf("probe:\n  a", createBlockRegistry([flaky]));
			expect(clicksOf(plan)).toEqual([]);
			expect(plan.diagnostics).toMatchObject([
				{
					code: "E201",
					line: 3,
					params: { type: "probe", reason: "not twice" },
				},
			]);
		});

		it("reads invalid step data as default steps without arrows", () => {
			const odd = probe(() => [
				null,
				{ at: 0, triggers: "x", location: "here" },
				{ at: 1.5, triggers: [7, "X"] },
			]);
			const plan = planOf(
				"probe:\n  a\n\nreveal id=x:\n  b",
				createBlockRegistry([odd, REVEAL]),
			);
			expect(clicksOf(plan)).toEqual([
				["0:0-1"],
				["0:1-2"],
				["0:2-3", "1:0-1"],
			]);
		});

		it("points diagnostics of steps without location at the block header", () => {
			const lost = probe(() => [
				{ at: null, triggers: ["ghost"], location: null },
			]);
			const plan = planOf("probe:\n  a", createBlockRegistry([lost]));
			expect(plan.diagnostics).toMatchObject([
				{ code: "E204", line: 3, column: 1 },
			]);
		});
	});

	it("renders diagnostics with the given messages", () => {
		const { deck } = parse("reveal:\n  a  → nowhere", {
			registry: createBlockRegistry([REVEAL]),
		});
		const slide = deck.slides[0];
		if (slide === undefined) throw new Error("The deck has no slide");
		const plan = compileStepPlan(slide, createBlockRegistry([REVEAL]), {
			messages: { E204: "Sin bloque {id}." },
		});
		expect(plan.diagnostics[0]?.message).toBe("Sin bloque nowhere.");
	});
});
