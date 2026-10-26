// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Runs directly with Node (type stripping), so it only uses erasable TypeScript
// syntax and Node built-ins: the CI job that calls it skips installing dependencies.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Longest changeset summary, in words, accepted in the changelog. */
export const MAX_SUMMARY_WORDS = 50;

/** Pull request label that marks a change users won't notice. */
export const SKIP_LABEL = "no-changeset";

export interface ChangesetFile {
	readonly path: string;
	readonly content: string;
}

export type CheckResult =
	| { readonly ok: true }
	| { readonly ok: false; readonly problems: readonly string[] };

const FRONT_MATTER = /^---\r?\n(?:[\s\S]*?\r?\n)?---(?:\r?\n|$)/;

/** Returns the changelog text of a changeset: everything after its front matter. */
export function changesetSummary(content: string): string {
	const frontMatter = FRONT_MATTER.exec(content);
	return content.slice(frontMatter ? frontMatter[0].length : 0).trim();
}

export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/** Tells whether a repository path is a changeset written by a contributor. */
export function isChangesetPath(path: string): boolean {
	return (
		/^\.changeset\/[^/]+\.md$/.test(path) && path !== ".changeset/README.md"
	);
}

/**
 * Checks the changesets added or edited by a pull request.
 *
 * @param files - Changesets changed by the pull request.
 * @param skipRequired - Whether the pull request carries the {@link SKIP_LABEL} label.
 */
export function checkChangesets(
	files: readonly ChangesetFile[],
	skipRequired: boolean,
): CheckResult {
	const problems: string[] = [];
	if (files.length === 0 && !skipRequired) {
		problems.push(
			`No changeset found. Run "pnpm changeset", or ask a maintainer for the "${SKIP_LABEL}" label if users won't notice this change.`,
		);
	}
	for (const file of files) {
		const words = countWords(changesetSummary(file.content));
		if (words > MAX_SUMMARY_WORDS) {
			problems.push(
				`${file.path}: the summary has ${words} words; the limit is ${MAX_SUMMARY_WORDS}.`,
			);
		}
	}
	return problems.length > 0 ? { ok: false, problems } : { ok: true };
}

function changedChangesets(baseRef: string): ChangesetFile[] {
	const output = execFileSync(
		"git",
		[
			"diff",
			"--name-only",
			"--diff-filter=AM",
			`${baseRef}...HEAD`,
			"--",
			".changeset",
		],
		{ encoding: "utf8" },
	);
	return output
		.split("\n")
		.filter(isChangesetPath)
		.map((path) => ({ path, content: readFileSync(path, "utf8") }));
}

if (import.meta.main) {
	const baseRef = process.argv[2];
	if (baseRef === undefined) {
		console.error(
			"Usage: node tooling/changesets/check-changesets.ts <base-ref>",
		);
		process.exit(2);
	}
	const result = checkChangesets(
		changedChangesets(baseRef),
		process.env.SKIP_CHANGESET === "true",
	);
	if (result.ok) {
		console.log("Changesets are valid.");
	} else {
		for (const problem of result.problems) {
			console.error(problem);
		}
		process.exitCode = 1;
	}
}
