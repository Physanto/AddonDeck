// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ContractCheck } from "./contract-check";
import { describeThrown } from "./describe-thrown";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === "object" && value !== null;
}

function problemsOf(step: unknown): string[] {
	if (!isRecord(step)) return ["is not an object"];
	const problems: string[] = [];
	const { at, triggers, location } = step;
	if (
		at !== null &&
		!(typeof at === "number" && Number.isInteger(at) && at >= 1)
	) {
		problems.push(`has at = ${String(at)}; use null or a whole number from 1`);
	}
	if (
		!Array.isArray(triggers) ||
		!triggers.every((id) => typeof id === "string")
	) {
		problems.push("has triggers that are not a list of ids");
	}
	if (
		location !== null &&
		!(
			isRecord(location) &&
			typeof location.line === "number" &&
			typeof location.column === "number"
		)
	) {
		problems.push("has a location that is neither null nor a line and column");
	}
	return problems;
}

/** `steps` never throws and lists well-formed steps. */
export const stepsAreValid: ContractCheck = {
	id: "steps-are-valid",
	title: "steps lists valid steps for every example",
	async run({ cases, options }) {
		const failures: string[] = [];
		for (const { label, model } of cases) {
			let steps: unknown;
			try {
				steps = options.definition.steps(model);
			} catch (error) {
				failures.push(`steps threw on ${label}: ${describeThrown(error)}`);
				continue;
			}
			if (!Array.isArray(steps)) {
				failures.push(`steps did not return a list on ${label}`);
				continue;
			}
			steps.forEach((step: unknown, index) => {
				for (const problem of problemsOf(step)) {
					failures.push(`step ${index + 1} of ${label} ${problem}`);
				}
			});
		}
		return failures;
	},
};
