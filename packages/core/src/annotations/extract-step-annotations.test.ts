// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { SourceLine } from "../model/source-line";
import { extractStepAnnotations } from "./extract-step-annotations";

function line(raw: string, text: string = raw): SourceLine {
	return { line: 7, raw, text };
}

describe("extractStepAnnotations", () => {
	it("reads a step and a trigger after two spaces", () => {
		expect(
			extractStepAnnotations(line('print("Paid!")    @3 → network')),
		).toEqual({
			content: 'print("Paid!")',
			annotation: {
				step: 3,
				triggers: ["network"],
				location: { line: 7, column: 19 },
			},
			diagnostics: [],
		});
	});

	it("accepts a tab as the separator", () => {
		expect(extractStepAnnotations(line("x\t@2")).annotation?.step).toBe(2);
	});

	it("reads ASCII arrows and several triggers", () => {
		const result = extractStepAnnotations(line("go  @2 -> Network → log"));
		expect(result.annotation?.triggers).toEqual(["network", "log"]);
		expect(result.content).toBe("go");
	});

	it("reads triggers without a step", () => {
		const result = extractStepAnnotations(line("go  → network"));
		expect(result.annotation).toMatchObject({
			step: null,
			triggers: ["network"],
		});
	});

	it("reads an arrow written next to its id", () => {
		expect(
			extractStepAnnotations(line("go  →network")).annotation?.triggers,
		).toEqual(["network"]);
	});

	it("leaves arrows that are content alone", () => {
		const result = extractStepAnnotations(line("Customer -> Shop: Hello"));
		expect(result).toEqual({
			content: "Customer -> Shop: Hello",
			annotation: null,
			diagnostics: [],
		});
	});

	it("keeps the longest annotation that is separated by two spaces", () => {
		const result = extractStepAnnotations(line("A -> B  -> C"));
		expect(result.content).toBe("A -> B");
		expect(result.annotation?.triggers).toEqual(["c"]);
	});

	it("does not read an arrow that is followed by an invalid id", () => {
		expect(extractStepAnnotations(line("x  -> 1st")).annotation).toBeNull();
		expect(extractStepAnnotations(line("x  ->1st")).annotation).toBeNull();
	});

	it("warns about a step after a single space and keeps it as text", () => {
		const result = extractStepAnnotations(line("- The first point @1"));
		expect(result.annotation).toBeNull();
		expect(result.content).toBe("- The first point @1");
		expect(result.diagnostics).toMatchObject([
			{ code: "W307", line: 7, column: 19, params: { step: "1" } },
		]);
	});

	it("does not warn about a single-spaced mention that is not a number", () => {
		expect(extractStepAnnotations(line("ask @maria")).diagnostics).toEqual([]);
	});

	it("does not warn about a single-spaced step followed by triggers", () => {
		expect(extractStepAnnotations(line("x @1 → y")).diagnostics).toEqual([]);
	});

	it.each(["@0", "@-1", "@two", "@1.5", "@99999999999999999999"])(
		"warns that %s is not a valid step and ignores the annotation",
		(step) => {
			const result = extractStepAnnotations(line(`- point  ${step} → net`));
			expect(result.annotation).toBeNull();
			expect(result.content).toBe("- point");
			expect(result.diagnostics).toMatchObject([
				{ code: "W310", column: 10, params: { step: step.slice(1) } },
			]);
		},
	);

	it("does not treat a step at the start of a line as an annotation", () => {
		expect(
			extractStepAnnotations(line("@1 r = waiting")).annotation,
		).toBeNull();
		expect(extractStepAnnotations(line("@1")).annotation).toBeNull();
	});

	it("ignores trailing spaces", () => {
		const result = extractStepAnnotations(line("x  @1   "));
		expect(result.annotation?.step).toBe(1);
		expect(extractStepAnnotations(line("plain   ")).content).toBe("plain");
	});

	it("reports columns against the line as written", () => {
		const result = extractStepAnnotations(line("    r = 1  @1", "r = 1  @1"));
		expect(result.annotation?.location.column).toBe(12);
	});

	it("renders its diagnostics with the given messages", () => {
		const result = extractStepAnnotations(line("x @1"), {
			messages: { W307: "two spaces before @{step}" },
		});
		expect(result.diagnostics[0]?.message).toBe("two spaces before @1");
	});
});
