// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { createSlideContext } from "../../test/support/contexts";
import { DEFAULT_SLIDE_OPTIONS } from "../model/defaults";
import type { InstalledResources } from "./parse-options";
import {
	type MutableSlideOptions,
	readSlideOptions,
} from "./read-slide-options";

function read(line: string, installed: InstalledResources = {}) {
	const context = createSlideContext(installed);
	const options: MutableSlideOptions = { ...DEFAULT_SLIDE_OPTIONS };
	readSlideOptions(line, 3, line.indexOf(":") + 1, options, context);
	return { options, diagnostics: context.reporter.diagnostics };
}

describe("readSlideOptions", () => {
	it("reads every option", () => {
		const { options, diagnostics } = read(
			"slide: background=aurora Transition=Zoom layout=columns",
		);
		expect(options).toEqual({
			background: "aurora",
			transition: "zoom",
			layout: "columns",
		});
		expect(diagnostics).toEqual([]);
	});

	it("lets the last value of an option win", () => {
		expect(read("slide: layout=rows layout=columns").options.layout).toBe(
			"columns",
		);
	});

	it("ignores an unknown option and suggests a close one", () => {
		const { options, diagnostics } = read("slide: transitoin=zoom");
		expect(options).toEqual(DEFAULT_SLIDE_OPTIONS);
		expect(diagnostics).toMatchObject([
			{ code: "W308", line: 3, column: 8, suggestion: "transition" },
		]);
	});

	it("ignores an unknown option without a suggestion when none is close", () => {
		const { diagnostics } = read("slide: speed=fast");
		expect(diagnostics[0]?.suggestion).toBeUndefined();
	});

	it("uses the default for an invalid value", () => {
		const { options, diagnostics } = read(
			"slide: layout=diagonal transition=spin",
		);
		expect(options).toEqual(DEFAULT_SLIDE_OPTIONS);
		expect(diagnostics).toMatchObject([
			{ code: "W309", params: { option: "layout", fallback: "auto" } },
			{ code: "W309", params: { option: "transition", fallback: "fade" } },
		]);
	});

	it("checks backgrounds against the installed ones when given", () => {
		const { options, diagnostics } = read("slide: background=night", {
			backgrounds: ["aurora"],
		});
		expect(options.background).toBeNull();
		expect(diagnostics).toMatchObject([
			{ code: "W309", params: { fallback: "paper" } },
		]);
	});

	it("ignores a word without a value", () => {
		const { diagnostics } = read("slide: columns");
		expect(diagnostics).toMatchObject([
			{ code: "W314", column: 8, params: { word: "columns" } },
		]);
	});
});
