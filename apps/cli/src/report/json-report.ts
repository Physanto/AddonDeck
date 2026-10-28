// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	Diagnostic,
	DiagnosticParams,
	DiagnosticSeverity,
} from "@addondeck/core";
import type { CommandName } from "../command-line/read-command-line";

/**
 * Version of the JSON that `addondeck check --json` prints. Fields are only
 * ever added within a version; removing or changing one starts a new one.
 */
export const REPORT_SCHEMA = 1;

/** A problem, as `check --json` prints it. */
export interface ReportDiagnostic {
	readonly severity: DiagnosticSeverity;
	/** Stable code, such as `W304`, `LIST-W03` or `EXPORT-W01`. */
	readonly code: string;
	/** 1-based; 0 for problems that are not in the deck text. */
	readonly line: number;
	/** 1-based; 0 for problems that are not in the deck text. */
	readonly column: number;
	/** In the active language. */
	readonly message: string;
	/** Values the message was rendered with. */
	readonly params: DiagnosticParams;
	/** Replacement text the author probably meant, when there is one. */
	readonly suggestion?: string;
}

/** How many problems of each severity there are. */
export interface ReportSummary {
	readonly errors: number;
	readonly warnings: number;
	readonly info: number;
}

/** What `addondeck check --json` prints when it could check the deck. */
export interface CheckReport {
	readonly schema: typeof REPORT_SCHEMA;
	readonly command: "check";
	/** The deck file, as given on the command line. */
	readonly file: string;
	/** `true` when there are no errors; warnings do not count. */
	readonly ok: boolean;
	readonly summary: ReportSummary;
	/** Problems of the deck text first, then those of the export. */
	readonly diagnostics: readonly ReportDiagnostic[];
}

/** What `addondeck --json` prints when the command line is wrong. */
export interface UsageReport {
	readonly schema: typeof REPORT_SCHEMA;
	readonly command: CommandName | null;
	readonly ok: false;
	/** What is wrong, in the active language. */
	readonly usage: string;
}

/** Counts the problems of each severity. */
export function summarize(diagnostics: readonly Diagnostic[]): ReportSummary {
	const count = (severity: DiagnosticSeverity): number =>
		diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
	return {
		errors: count("error"),
		warnings: count("warning"),
		info: count("info"),
	};
}

function toReportDiagnostic(diagnostic: Diagnostic): ReportDiagnostic {
	return {
		severity: diagnostic.severity,
		code: diagnostic.code,
		line: diagnostic.line,
		column: diagnostic.column,
		message: diagnostic.message,
		params: diagnostic.params,
		...(diagnostic.suggestion === undefined
			? {}
			: { suggestion: diagnostic.suggestion }),
	};
}

/** The report of `check --json`, with exactly the documented fields. */
export function createCheckReport(
	file: string,
	diagnostics: readonly Diagnostic[],
): CheckReport {
	const summary = summarize(diagnostics);
	return {
		schema: REPORT_SCHEMA,
		command: "check",
		file,
		ok: summary.errors === 0,
		summary,
		diagnostics: diagnostics.map(toReportDiagnostic),
	};
}

/** The report of a wrong command line given with `--json`. */
export function createUsageReport(
	command: CommandName | null,
	usage: string,
): UsageReport {
	return { schema: REPORT_SCHEMA, command, ok: false, usage };
}
