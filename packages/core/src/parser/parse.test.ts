// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { codes } from "../../test/support/contexts";
import { createTestRegistry } from "../../test/support/test-registry";
import { DEFAULT_DECK_META, DEFAULT_SLIDE_OPTIONS } from "../model/defaults";
import { createBlockRegistry } from "../registry/create-block-registry";
import { parse } from "./parse";

const registry = createTestRegistry();

function run(text: string) {
	return parse(text, { registry });
}

describe("parse", () => {
	it("reads a deck without a header with every default", () => {
		const { deck, diagnostics } = run("# Hello\nWorld");
		expect(deck.meta).toEqual({ ...DEFAULT_DECK_META, title: "Hello" });
		expect(deck.header).toEqual([]);
		expect(deck.sections).toEqual([]);
		expect(deck.slides).toEqual([
			{
				index: 0,
				section: null,
				options: DEFAULT_SLIDE_OPTIONS,
				content: [
					{
						kind: "text",
						lines: [
							{ line: 1, raw: "# Hello", text: "# Hello" },
							{ line: 2, raw: "World", text: "World" },
						],
						location: { line: 1, column: 1 },
					},
				],
				notes: null,
				location: { line: 1, column: 1 },
			},
		]);
		expect(codes(diagnostics)).toEqual(["I401"]);
	});

	it("reads empty text as a deck with no slides", () => {
		const { deck } = run("");
		expect(deck.slides).toEqual([]);
		expect(deck.meta.title).toBe("");
	});

	it("prefers the header title to the first heading", () => {
		expect(run("format: 1\ntitle: Set\n\n# Heading").deck.meta.title).toBe(
			"Set",
		);
	});

	it("takes the title from the first level-1 heading of any slide", () => {
		expect(run("format: 1\n## Sub\n---\n# Later").deck.meta.title).toBe(
			"Later",
		);
	});

	it("starts the first slide after a separator that ends the header", () => {
		const { deck, diagnostics } = run("format: 1\n---\ntitle: shown as text");
		expect(deck.meta.title).toBe("");
		expect(deck.slides).toHaveLength(1);
		expect(diagnostics).toEqual([]);
	});

	it("skips blank space around the first and last separators silently", () => {
		const { deck, diagnostics } = run("---\n# A\n---\n\n");
		expect(deck.slides).toHaveLength(1);
		expect(codes(diagnostics)).toEqual(["I401"]);
	});

	it("skips an empty slide in the middle with I402", () => {
		const { deck, diagnostics } = run("format: 1\n# A\n---\n\n---\n# B");
		expect(deck.slides.map((slide) => slide.index)).toEqual([0, 1]);
		expect(diagnostics).toMatchObject([{ code: "I402", line: 4 }]);
	});

	it("assigns slides to sections and numbers both", () => {
		const { deck } = run(
			"format: 1\n# Intro\n---\nsection: One\n# A\n---\n# B\n---\nsection: Two\n# C",
		);
		expect(deck.sections).toEqual([
			{
				index: 0,
				title: "One",
				firstSlide: 1,
				location: { line: 4, column: 1 },
			},
			{
				index: 1,
				title: "Two",
				firstSlide: 3,
				location: { line: 9, column: 1 },
			},
		]);
		expect(deck.slides.map((slide) => slide.section)).toEqual([null, 0, 0, 1]);
	});

	it("starts a section from an empty slide at the next slide", () => {
		const { deck, diagnostics } = run(
			"format: 1\n# A\n---\nsection: S\n---\n# B",
		);
		expect(deck.sections).toMatchObject([{ title: "S", firstSlide: 1 }]);
		expect(deck.slides[1]?.section).toBe(0);
		expect(codes(diagnostics)).toEqual(["I402"]);
	});

	it("drops sections that end up with no slides", () => {
		const { deck } = run(
			"format: 1\nsection: Lost\nsection: Kept\n# A\n---\nsection: Trailing",
		);
		expect(deck.sections.map((section) => section.title)).toEqual(["Kept"]);
	});

	it("reports ids repeated across slides", () => {
		const { diagnostics } = run(
			"format: 1\nsequence id=a:\n  x\n---\nsequence id=A:\n  y",
		);
		expect(diagnostics).toMatchObject([{ code: "E202", line: 5 }]);
	});

	it("keeps a block whose parse throws, with a null model and E201", () => {
		const { deck, diagnostics } = run("format: 1\nexplode id=x:\n  boom");
		expect(deck.slides[0]?.content[0]).toMatchObject({
			kind: "block",
			id: "x",
			model: null,
		});
		expect(diagnostics).toMatchObject([
			{ code: "E201", params: { reason: "boom" } },
		]);
	});

	it("sorts diagnostics by line and column, keeping the order of equal positions", () => {
		const { diagnostics } = run("titel: x\n# A\n- b @1\n- c  @0");
		expect(diagnostics.map((d) => `${d.code}@${d.line}`)).toEqual([
			"W301@1",
			"I401@1",
			"W307@3",
			"W310@4",
		]);
	});

	it("renders messages with the given catalog and falls back to English", () => {
		const { diagnostics } = parse("titel: x", {
			registry,
			messages: {
				W301: "Clave desconocida: {key}.",
				didYouMean: "¿Quisiste decir {suggestion}?",
			},
		});
		expect(diagnostics.map((d) => d.message)).toEqual([
			"Clave desconocida: titel. ¿Quisiste decir title?",
			'There is no "format:" line, so format 1 is assumed.',
		]);
	});

	it("checks installed resources when they are given", () => {
		const { deck, diagnostics } = parse("format: 1\ntheme: neon\n# A", {
			registry,
			installed: { themes: ["paper"] },
		});
		expect(deck.meta.theme).toBe("paper");
		expect(codes(diagnostics)).toEqual(["W303"]);
	});

	it("recognizes blocks through language pack aliases", () => {
		const withSpanish = createBlockRegistry(
			[
				{
					type: "sequence",
					aliases: [],
					version: "1.0.0",
					parse: () => ({ model: 1, diagnostics: [] }),
					steps: () => [],
				},
			],
			{
				languagePacks: [
					{ language: "es", blocks: { sequence: ["secuencia"] } },
				],
			},
		);
		const { deck } = parse("format: 1\nSecuencia:\n  A -> B", {
			registry: withSpanish,
		});
		expect(deck.slides[0]?.content[0]).toMatchObject({
			kind: "block",
			type: "sequence",
			keyword: "Secuencia",
		});
	});

	it("shows every block as text when the registry is empty", () => {
		const { deck } = parse("format: 1\nsequence:\n  A -> B", {
			registry: createBlockRegistry([]),
		});
		expect(deck.slides[0]?.content).toMatchObject([{ kind: "text" }]);
	});
});
