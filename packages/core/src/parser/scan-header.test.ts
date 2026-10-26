// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { codes, createHeaderContext } from "../../test/support/contexts";
import { DEFAULT_DECK_META } from "../model/defaults";
import { scanHeader } from "./scan-header";

function scan(text: string, context = createHeaderContext()) {
	const result = scanHeader(text.split("\n"), context);
	return { ...result, diagnostics: context.reporter.diagnostics };
}

describe("scanHeader", () => {
	it("reads every header key", () => {
		const { meta, diagnostics } = scan(
			[
				"format: 1",
				"title: Quarterly results",
				"author: Ana Pérez",
				"language: pt-BR",
				"theme: Ocean",
				"motion: Energetic",
				"color: #336699",
				"accent: tomato",
				"font: Inter",
				"background: aurora",
				"watermark: no",
			].join("\n"),
		);
		expect(meta).toEqual({
			format: 1,
			title: "Quarterly results",
			author: "Ana Pérez",
			language: "pt-BR",
			theme: "ocean",
			motion: "energetic",
			color: "#336699",
			accent: "tomato",
			font: "Inter",
			background: "aurora",
			watermark: false,
		});
		expect(diagnostics).toEqual([]);
	});

	it("keeps header lines as written", () => {
		const { entries } = scan("Format :  1");
		expect(entries).toEqual([
			{
				key: "format",
				keyword: "Format",
				value: "1",
				location: { line: 1, column: 1 },
			},
		]);
	});

	it("ends at the first line that is not a header key", () => {
		expect(scan("format: 1\n\n// note\n# Title\ntheme: ocean").end).toBe(3);
	});

	it("ends at a separator", () => {
		expect(scan("format: 1\n---\ntitle: x").end).toBe(1);
	});

	it("ends at a block or directive keyword even when it is close to a header key", () => {
		const context = createHeaderContext();
		expect(scan("format: 1\nsection: Intro", context).end).toBe(1);
		expect(scan("format: 1\nsequence:", context).end).toBe(1);
	});

	it("uses defaults and reports that the format is missing", () => {
		const { meta, diagnostics, end } = scan("# Hello");
		expect(meta).toEqual(DEFAULT_DECK_META);
		expect(end).toBe(0);
		expect(codes(diagnostics)).toEqual(["I401"]);
	});

	it("ignores a key close to a header key, suggests it and keeps reading", () => {
		const { meta, diagnostics } = scan("format: 1\ntitel: Typo\ntheme: ocean");
		expect(meta.theme).toBe("ocean");
		expect(meta.title).toBe("");
		expect(diagnostics).toMatchObject([
			{ code: "W301", line: 2, suggestion: "title", params: { key: "titel" } },
		]);
	});

	it("lets the last repeated key win", () => {
		const { meta, entries, diagnostics } = scan(
			"format: 1\ntitle: A\ntitle: B",
		);
		expect(meta.title).toBe("B");
		expect(entries).toHaveLength(3);
		expect(diagnostics).toMatchObject([
			{ code: "W302", params: { firstLine: 2 } },
		]);
	});

	it.each([
		["language: not a tag", "language"],
		["theme:", "theme"],
		["motion: wild", "motion"],
		["color: #12", "color"],
		["accent: notacolor", "accent"],
		["font:", "font"],
		["background:", "background"],
		["watermark: maybe", "watermark"],
	])("uses the default for %s", (line, key) => {
		const { meta, diagnostics } = scan(`format: 1\n${line}`);
		expect(meta).toEqual(DEFAULT_DECK_META);
		expect(diagnostics).toMatchObject([
			{ code: "W303", line: 2, params: { key } },
		]);
	});

	it("checks names against the installed resources when they are given", () => {
		const context = createHeaderContext({
			themes: ["paper", "Ocean"],
			fonts: ["Inter"],
			backgrounds: ["aurora"],
		});
		const { meta, diagnostics } = scan(
			"format: 1\ntheme: neon\nfont: Comic\nbackground: night\nbackground: Aurora\nbackground: #fff",
			context,
		);
		expect(meta.theme).toBe("paper");
		expect(meta.font).toBeNull();
		expect(meta.background).toBe("#fff");
		expect(codes(diagnostics)).toEqual([
			"W303",
			"W303",
			"W303",
			"W302",
			"W302",
		]);
	});

	it("reports a format newer than supported and reads it as the current one", () => {
		const { meta, declaredFormat, diagnostics } = scan("format: 2");
		expect(meta.format).toBe(1);
		expect(declaredFormat).toBe(2);
		expect(diagnostics).toMatchObject([
			{ code: "E101", column: 9, params: { version: "2", supported: 1 } },
		]);
	});

	it.each(["one", "0", "-1", "1.5", ""])(
		"reports %j as an invalid format",
		(value) => {
			const { declaredFormat, diagnostics } = scan(`format: ${value}`);
			expect(declaredFormat).toBeNull();
			expect(codes(diagnostics)).toEqual(["E102"]);
		},
	);
});
