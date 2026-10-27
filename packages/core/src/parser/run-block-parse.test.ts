// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { BlockDefinition } from "../contracts/block-definition";
import type { BlockSource } from "../contracts/block-source";
import { createReporter } from "./reporter";
import { runBlockParse } from "./run-block-parse";

const SOURCE: BlockSource = {
	type: "probe",
	keyword: "probe",
	id: null,
	args: [],
	options: [],
	body: [],
	location: { line: 4, column: 1 },
};

function probe(
	parse: () => unknown,
	steps: () => unknown = () => [],
): BlockDefinition {
	return {
		type: "probe",
		aliases: [],
		version: "1.0.0",
		parse: parse as BlockDefinition["parse"],
		steps: steps as BlockDefinition["steps"],
	};
}

describe("runBlockParse", () => {
	it("returns the model and keeps the block's diagnostics", () => {
		const reporter = createReporter(undefined);
		const diagnostic = {
			severity: "warning",
			code: "PROBE1",
			line: 5,
			column: 3,
			message: "m",
			params: {},
		} as const;
		const model = runBlockParse(
			probe(() => ({ model: { ok: true }, diagnostics: [diagnostic] })),
			SOURCE,
			reporter,
		);
		expect(model).toEqual({ ok: true });
		expect(reporter.diagnostics).toEqual([diagnostic]);
	});

	it.each([
		["an error", () => new Error("boom"), "boom"],
		["an error without a message", () => new TypeError(), "TypeError"],
		["a string", () => "bad input", "bad input"],
		["an object that cannot be printed", () => Object.create(null), "object"],
	])("turns throwing %s into E201", (_, make, reason) => {
		const reporter = createReporter(undefined);
		const model = runBlockParse(
			probe(() => {
				throw make();
			}),
			SOURCE,
			reporter,
		);
		expect(model).toBeNull();
		expect(reporter.diagnostics).toMatchObject([
			{ code: "E201", line: 4, params: { type: "probe", reason } },
		]);
	});

	it.each([
		["nothing", () => undefined],
		["diagnostics that are not a list", () => ({ model: 1, diagnostics: 5 })],
	])("turns returning %s into E201", (_, parse) => {
		const reporter = createReporter(undefined);
		expect(runBlockParse(probe(parse), SOURCE, reporter)).toBeNull();
		expect(reporter.diagnostics[0]?.code).toBe("E201");
	});

	it("reads a missing model as null", () => {
		const reporter = createReporter(undefined);
		expect(
			runBlockParse(
				probe(() => ({ diagnostics: [] })),
				SOURCE,
				reporter,
			),
		).toBeNull();
		expect(reporter.diagnostics).toEqual([]);
	});

	it.each([
		[
			"throws",
			() => {
				throw new Error("no steps");
			},
		],
		["returns something that is not a list", () => 3],
	])("turns a model whose steps %s into E201", (_, steps) => {
		const reporter = createReporter(undefined);
		const model = runBlockParse(
			probe(() => ({ model: 1, diagnostics: [] }), steps),
			SOURCE,
			reporter,
		);
		expect(model).toBeNull();
		expect(reporter.diagnostics).toMatchObject([
			{ code: "E201", line: 4, params: { type: "probe" } },
		]);
	});
});
