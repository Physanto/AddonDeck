// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * A problem the runtime found while showing a deck, already rendered in the
 * active language.
 */
export interface RuntimeIssue {
	/** Errors leave something out of the deck; warnings don't. */
	readonly severity: "error" | "warning";
	readonly message: string;
}

/** Receives each issue as the runtime finds it. */
export type IssueReporter = (issue: RuntimeIssue) => void;

/**
 * Reports issues on the browser console, where whoever builds or exports a
 * deck looks first.
 */
export function reportToConsole(issue: RuntimeIssue): void {
	if (issue.severity === "error") console.error(issue.message);
	else console.warn(issue.message);
}
