// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ParseResult } from "@addondeck/core";
import type { ContractCheck } from "./contract-check";
import type { ContractSubject } from "./contract-subject";
import { describeThrown } from "./describe-thrown";
import { hostileSources, type LabeledSource } from "./hostile-sources";

type Outcome =
	| { readonly kind: "result"; readonly result: ParseResult<unknown> }
	| { readonly kind: "invalid" }
	| { readonly kind: "threw"; readonly error: unknown };

function inputsOf(subject: ContractSubject): LabeledSource[] {
	return subject.sources.flatMap((source) => [
		source,
		...hostileSources(source),
	]);
}

function runParse(subject: ContractSubject, input: LabeledSource): Outcome {
	try {
		const result: unknown = subject.options.definition.parse(input.source);
		if (
			typeof result !== "object" ||
			result === null ||
			!("diagnostics" in result) ||
			!Array.isArray(result.diagnostics)
		) {
			return { kind: "invalid" };
		}
		return { kind: "result", result: result as ParseResult<unknown> };
	} catch (error) {
		return { kind: "threw", error };
	}
}

function isPositiveInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

/** `parse` never throws and always returns a parse result. */
export const parseNeverThrows: ContractCheck = {
	id: "parse-never-throws",
	title: "parse never throws, whatever the source",
	async run(subject) {
		const failures: string[] = [];
		for (const input of inputsOf(subject)) {
			const outcome = runParse(subject, input);
			if (outcome.kind === "threw") {
				failures.push(
					`parse threw on ${input.label}: ${describeThrown(outcome.error)}`,
				);
			} else if (outcome.kind === "invalid") {
				failures.push(
					`parse returned something that is not a parse result on ${input.label}`,
				);
			}
		}
		return failures;
	},
};

/** Every diagnostic of `parse` has a code, a message and a position inside the block. */
export const diagnosticsHaveLines: ContractCheck = {
	id: "diagnostics-have-lines",
	title: "parse reports diagnostics on lines of the block",
	async run(subject) {
		const failures: string[] = [];
		for (const input of inputsOf(subject)) {
			const outcome = runParse(subject, input);
			if (outcome.kind !== "result") continue;
			const { source } = input;
			const first = source.location.line;
			const last = Math.max(first, ...source.body.map((line) => line.line));
			for (const diagnostic of outcome.result.diagnostics) {
				const { code, line, column, message } = diagnostic;
				const name = `diagnostic ${String(code)} on ${input.label}`;
				if (typeof code !== "string" || code === "") {
					failures.push(`${name} has no code`);
				}
				if (typeof message !== "string" || message.trim() === "") {
					failures.push(`${name} has no message`);
				}
				if (!isPositiveInteger(line) || line < first || line > last) {
					failures.push(
						`${name} is on line ${String(line)}, outside lines ${first}-${last}`,
					);
				}
				if (!isPositiveInteger(column)) {
					failures.push(
						`${name} has column ${String(column)}; columns start at 1`,
					);
				}
			}
		}
		return failures;
	},
};
