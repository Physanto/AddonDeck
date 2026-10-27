// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { BlockDefinition } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import type { BlockView } from "../block/block-view";
import type { BlockContractOptions } from "./block-contract-options";
import { checkBlockContract } from "./check-block-contract";
import { stepsAreValid } from "./check-steps";
import type { ContractCheckId } from "./contract-check-id";
import { type ContractSubject, prepareSubject } from "./contract-subject";
import { REVEAL_OPTIONS } from "./fixtures/broken-reveal-blocks";
import { REVEAL_DEFINITION, type RevealModel } from "./fixtures/reveal-block";

async function failuresOf(
	options: BlockContractOptions<RevealModel>,
	id: ContractCheckId,
): Promise<readonly string[]> {
	const report = await checkBlockContract(options);
	return report.checks.find((check) => check.id === id)?.failures ?? [];
}

function withView(
	instance: Partial<ReturnType<BlockView<RevealModel>["mount"]>>,
): BlockContractOptions<RevealModel> {
	return {
		...REVEAL_OPTIONS,
		playTimeout: 20,
		view: {
			type: "reveal",
			mount: () => ({
				setState: () => {},
				play: async () => {},
				destroy: () => {},
				...instance,
			}),
		},
	};
}

function withParse(
	parse: BlockDefinition<RevealModel>["parse"],
): BlockContractOptions<RevealModel> {
	return { ...REVEAL_OPTIONS, definition: { ...REVEAL_DEFINITION, parse } };
}

describe("block contract failures", () => {
	it("explains a mount that throws in every view rule", async () => {
		const options: BlockContractOptions<RevealModel> = {
			...REVEAL_OPTIONS,
			view: {
				type: "reveal",
				mount: () => {
					throw new Error("no canvas");
				},
			},
		};
		for (const id of [
			"mount-shows-step-zero",
			"set-state-is-idempotent",
			"play-matches-set-state",
			"set-state-goes-back",
			"destroy-cleans-up",
		] as const) {
			expect(await failuresOf(options, id)).toContain(
				"mount threw on reveal.deck, line 5: no canvas",
			);
		}
	});

	it("explains a setState that throws", async () => {
		const failures = await failuresOf(
			withView({
				setState: () => {
					throw new Error("bad step");
				},
			}),
			"set-state-is-idempotent",
		);
		expect(failures).toContain("reveal.deck, line 5: bad step");
	});

	it("explains a play that never ends or rejects", async () => {
		const stuck = await failuresOf(
			withView({ play: () => new Promise(() => {}) }),
			"play-matches-set-state",
		);
		expect(stuck).toContain(
			"reveal.deck, line 5: play(0, 1) did not finish within 20 ms",
		);
		const rejected = await failuresOf(
			withView({ play: () => Promise.reject(new Error("lost")) }),
			"play-matches-set-state",
		);
		expect(rejected).toContain("reveal.deck, line 5: play(0, 1) threw: lost");
	});

	it("explains a destroy that throws", async () => {
		const failures = await failuresOf(
			withView({
				destroy: () => {
					throw new Error("still busy");
				},
			}),
			"destroy-cleans-up",
		);
		expect(failures).toContain(
			"reveal.deck, line 5: destroy left destroy could not be checked: still busy",
		);
	});

	it("explains nodes left in the document", async () => {
		const failures = await failuresOf(
			withView({
				destroy: () => {
					document.body.append(document.createElement("aside"));
					document.head.append(document.createElement("style"));
				},
			}),
			"destroy-cleans-up",
		);
		expect(failures).toEqual(
			expect.arrayContaining([
				"reveal.deck, line 5: destroy left 1 node(s) in the document body",
				"reveal.deck, line 5: destroy left 1 node(s) in the document head",
			]),
		);
		for (const node of document.querySelectorAll("aside, head style")) {
			node.remove();
		}
	});

	it("explains event bus subscriptions left behind", async () => {
		const options: BlockContractOptions<RevealModel> = {
			...REVEAL_OPTIONS,
			view: {
				type: "reveal",
				mount: (_model, _el, ctx) => {
					ctx.events.on("anything", () => {});
					return {
						setState: () => {},
						play: async () => {},
						destroy: () => {},
					};
				},
			},
		};
		expect(await failuresOf(options, "destroy-cleans-up")).toContain(
			"reveal.deck, line 5: destroy left 1 event bus subscription(s)",
		);
	});

	it("explains parse results that are not parse results", async () => {
		const failures = await failuresOf(
			withParse(() => ({ model: [], diagnostics: 3 }) as never),
			"parse-never-throws",
		);
		expect(failures[0]).toMatch(
			/^parse returned something that is not a parse result on /,
		);
	});

	it("explains diagnostics without code, message or column", async () => {
		const failures = await failuresOf(
			withParse((source) => ({
				model: [],
				diagnostics: [
					{
						severity: "warning",
						code: "",
						line: source.location.line,
						column: 0,
						message: " ",
						params: {},
					},
				],
			})),
			"diagnostics-have-lines",
		);
		expect(failures.slice(0, 2)).toEqual([
			"diagnostic  on reveal.deck, line 5 has no code",
			"diagnostic  on reveal.deck, line 5 has no message",
		]);
		expect(failures[2]).toMatch(/has column 0; columns start at 1$/);
	});

	it("explains each problem of invalid steps", async () => {
		const subject = prepareSubject(REVEAL_OPTIONS);
		const steps = (): never =>
			[null, { at: null, triggers: [1], location: "here" }] as never;
		const failures = await stepsAreValid.run({
			...subject,
			options: {
				...REVEAL_OPTIONS,
				definition: { ...REVEAL_DEFINITION, steps },
			},
		} as ContractSubject);
		expect(failures.slice(0, 3)).toEqual([
			"step 1 of reveal.deck, line 5 is not an object",
			"step 2 of reveal.deck, line 5 has triggers that are not a list of ids",
			"step 2 of reveal.deck, line 5 has a location that is neither null nor a line and column",
		]);
	});

	it("explains steps that throw or return something else", async () => {
		// The parser already turns these into E201, so only a block whose steps
		// change between calls reaches the check with them.
		const subject = prepareSubject(REVEAL_OPTIONS);
		const run = (steps: () => unknown) =>
			stepsAreValid.run({
				...subject,
				options: {
					...REVEAL_OPTIONS,
					definition: { ...REVEAL_DEFINITION, steps: steps as never },
				},
			} as ContractSubject);
		expect(await run(() => "nope")).toContain(
			"steps did not return a list on reveal.deck, line 5",
		);
		expect(
			await run(() => {
				throw new Error("tired");
			}),
		).toContain("steps threw on single.deck, line 3: tired");
	});

	it("explains missing examples, unused blocks and docs that do not name the block", async () => {
		expect(
			await failuresOf(
				{ ...REVEAL_OPTIONS, examples: [] },
				"examples-are-valid",
			),
		).toEqual(["the block has no examples"]);
		expect(
			await failuresOf(
				{
					...REVEAL_OPTIONS,
					examples: [{ name: "text.deck", source: "format: 1\n\n# Only text" }],
				},
				"examples-are-valid",
			),
		).toEqual(['text.deck has no "reveal" block that could be read']);
		expect(
			await failuresOf({ ...REVEAL_OPTIONS, docs: "# Lists" }, "docs-exist"),
		).toEqual(['docs.md never mentions the block keyword "reveal"']);
	});

	it("checks the parser on a minimal block when there are no examples", async () => {
		const failures = await failuresOf(
			{
				...withParse(() => {
					throw new Error("always");
				}),
				examples: [],
			},
			"parse-never-throws",
		);
		expect(failures[0]).toBe("parse threw on a minimal block: always");
	});

	it("explains an empty translation", async () => {
		expect(
			await failuresOf(
				{ ...REVEAL_OPTIONS, translations: { es: " " } },
				"translations-exist",
			),
		).toEqual(["docs.es.md is empty"]);
	});
});
