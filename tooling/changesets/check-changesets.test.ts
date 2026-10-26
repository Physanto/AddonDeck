// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import {
	type ChangesetFile,
	changesetSummary,
	checkChangesets,
	countWords,
	isChangesetPath,
	MAX_SUMMARY_WORDS,
} from "./check-changesets";

function changeset(summary: string): ChangesetFile {
	return {
		path: ".changeset/brave-lions-dance.md",
		content: `---\n"@addondeck/blocks": minor\n---\n\n${summary}\n`,
	};
}

function words(count: number): string {
	return Array.from({ length: count }, (_, index) => `word${index}`).join(" ");
}

describe("changesetSummary", () => {
	it("drops the front matter", () => {
		expect(changesetSummary(changeset("Add row sorting.").content)).toBe(
			"Add row sorting.",
		);
	});

	it("handles an empty front matter", () => {
		expect(changesetSummary("---\n---\n\nInternal only.\n")).toBe(
			"Internal only.",
		);
	});
});

describe("countWords", () => {
	it("counts words across lines and repeated spaces", () => {
		expect(countWords("Add  animated\nrow sorting.")).toBe(4);
	});

	it("counts nothing in blank text", () => {
		expect(countWords(" \n\t")).toBe(0);
	});
});

describe("isChangesetPath", () => {
	it("accepts a changeset file", () => {
		expect(isChangesetPath(".changeset/brave-lions-dance.md")).toBe(true);
	});

	it("ignores the folder readme and configuration", () => {
		expect(isChangesetPath(".changeset/README.md")).toBe(false);
		expect(isChangesetPath(".changeset/config.json")).toBe(false);
	});
});

describe("checkChangesets", () => {
	it("passes with a short changeset", () => {
		expect(checkChangesets([changeset("Add row sorting.")], false)).toEqual({
			ok: true,
		});
	});

	it("accepts a summary of exactly the word limit", () => {
		expect(
			checkChangesets([changeset(words(MAX_SUMMARY_WORDS))], false).ok,
		).toBe(true);
	});

	it("rejects a summary over the word limit", () => {
		const result = checkChangesets(
			[changeset(words(MAX_SUMMARY_WORDS + 1))],
			false,
		);
		expect(result).toEqual({
			ok: false,
			problems: [
				`.changeset/brave-lions-dance.md: the summary has ${MAX_SUMMARY_WORDS + 1} words; the limit is ${MAX_SUMMARY_WORDS}.`,
			],
		});
	});

	it("requires a changeset when the pull request has no skip label", () => {
		expect(checkChangesets([], false).ok).toBe(false);
	});

	it("allows no changeset when the pull request has the skip label", () => {
		expect(checkChangesets([], true)).toEqual({ ok: true });
	});

	it("still enforces the word limit when the skip label is present", () => {
		expect(
			checkChangesets([changeset(words(MAX_SUMMARY_WORDS + 1))], true).ok,
		).toBe(false);
	});
});
