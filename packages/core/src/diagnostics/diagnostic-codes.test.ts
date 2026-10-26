// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_CODES, type DiagnosticCode } from "./diagnostic-codes";
import { EN_DIAGNOSTIC_MESSAGES } from "./messages-en";

const CODES = Object.keys(DIAGNOSTIC_CODES) as DiagnosticCode[];
const SEVERITY_BY_PREFIX = { E: "error", W: "warning", I: "info" } as const;
const RANGE_BY_PREFIX = { E: [1, 2], W: [3], I: [4] } as const;

function placeholders(template: string): string[] {
	return [...template.matchAll(/\{(\w+)\}/g)]
		.map((match) => match[1] ?? "")
		.filter((name, index, names) => names.indexOf(name) === index)
		.sort();
}

describe("diagnostic codes", () => {
	it.each(CODES)("%s has the severity its prefix announces", (code) => {
		const prefix = code[0] as keyof typeof SEVERITY_BY_PREFIX;
		expect(DIAGNOSTIC_CODES[code].severity).toBe(SEVERITY_BY_PREFIX[prefix]);
	});

	it.each(CODES)("%s is in the hundreds range of its kind", (code) => {
		const prefix = code[0] as keyof typeof RANGE_BY_PREFIX;
		const hundreds = Number(code[1]);
		expect(RANGE_BY_PREFIX[prefix]).toContain(hundreds);
		expect(code).toMatch(/^[EWI]\d{3}$/);
	});

	it.each(CODES)(
		"%s has an English message using exactly its parameters",
		(code) => {
			expect(placeholders(EN_DIAGNOSTIC_MESSAGES[code])).toEqual(
				[...DIAGNOSTIC_CODES[code].params].sort(),
			);
		},
	);

	it("offers the suggestion phrase with its placeholder", () => {
		expect(placeholders(EN_DIAGNOSTIC_MESSAGES.didYouMean)).toEqual([
			"suggestion",
		]);
	});
});
