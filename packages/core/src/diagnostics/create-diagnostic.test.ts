// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { createDiagnostic } from "./create-diagnostic";

const AT = { line: 7, column: 3 };

describe("createDiagnostic", () => {
	it("renders the English message with its parameters", () => {
		expect(
			createDiagnostic("E202", AT, { id: "payment", firstLine: 4 }),
		).toEqual({
			severity: "error",
			code: "E202",
			line: 7,
			column: 3,
			message: 'The id "payment" is already used on line 4.',
			params: { id: "payment", firstLine: 4 },
		});
	});

	it("takes the severity from the code", () => {
		expect(createDiagnostic("I402", AT, {}).severity).toBe("info");
		expect(createDiagnostic("W313", AT, {}).severity).toBe("warning");
	});

	it("adds the suggestion to the diagnostic and to its message", () => {
		const diagnostic = createDiagnostic(
			"W304",
			AT,
			{ keyword: "secuence" },
			{ suggestion: "sequence" },
		);
		expect(diagnostic.suggestion).toBe("sequence");
		expect(diagnostic.message).toBe(
			'Unknown block "secuence"; it is shown as text. Did you mean "sequence"?',
		);
	});

	it("leaves out the suggestion when there is none", () => {
		expect(createDiagnostic("W313", AT, {})).not.toHaveProperty("suggestion");
	});

	it("uses the messages of the active language", () => {
		const diagnostic = createDiagnostic(
			"W301",
			AT,
			{ key: "titel" },
			{
				suggestion: "title",
				messages: {
					W301: 'Clave desconocida "{key}".',
					didYouMean: '¿Quisiste decir "{suggestion}"?',
				},
			},
		);
		expect(diagnostic.message).toBe(
			'Clave desconocida "titel". ¿Quisiste decir "title"?',
		);
	});

	it("falls back to English for messages a language does not have", () => {
		const diagnostic = createDiagnostic(
			"W313",
			AT,
			{},
			{ messages: { W301: "Clave desconocida." } },
		);
		expect(diagnostic.message).toBe('"notes:" has no indented text below it.');
	});
});
