// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { codes, sourceLines } from "../../test/support/contexts";
import { readIndentedBody } from "./read-indented-body";
import { createReporter } from "./reporter";

describe("readIndentedBody", () => {
	it("removes the base indentation and keeps deeper indentation", () => {
		const lines = sourceLines("header:\n  lines:\n    r = 1\n\n  done\nnext");
		const body = readIndentedBody(lines, 1, createReporter(undefined));
		expect(body.lines.map((line) => line.text)).toEqual([
			"lines:",
			"  r = 1",
			"",
			"done",
		]);
		expect(body.lines[1]?.raw).toBe("    r = 1");
		expect(body.end).toBe(5);
	});

	it("drops trailing blank lines", () => {
		const lines = sourceLines("h:\n\ta\n\n\nnext");
		expect(readIndentedBody(lines, 1, createReporter(undefined))).toMatchObject(
			{
				lines: [{ text: "a" }],
				end: 2,
			},
		);
	});

	it("is empty when the next line is not indented", () => {
		const lines = sourceLines("h:\n\nnext");
		expect(readIndentedBody(lines, 1, createReporter(undefined))).toEqual({
			lines: [],
			end: 1,
		});
	});

	it("warns about a line indented less than the base and keeps its content", () => {
		const reporter = createReporter(undefined);
		const lines = sourceLines("h:\n    A\n  B");
		const body = readIndentedBody(lines, 1, reporter);
		expect(body.lines.map((line) => line.text)).toEqual(["A", "B"]);
		expect(codes(reporter.diagnostics)).toEqual(["W312"]);
		expect(reporter.diagnostics[0]?.line).toBe(3);
	});
});
