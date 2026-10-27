// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockContractOptions } from "./block-contract-options";
import type { ContractCheckId } from "./contract-check-id";
import { CONTRACT_CHECKS } from "./contract-checks";
import { prepareSubject } from "./contract-subject";

/** The outcome of one rule of the block contract. */
export interface ContractCheckResult {
	readonly id: ContractCheckId;
	readonly title: string;
	/** One message per problem; empty when the block follows the rule. */
	readonly failures: readonly string[];
}

/** The outcome of the whole block contract. */
export interface ContractReport {
	/** Whether every rule passed. */
	readonly passed: boolean;
	/** One result per rule, in the order of {@link CONTRACT_CHECK_IDS}. */
	readonly checks: readonly ContractCheckResult[];
}

/**
 * Checks a block against every rule of the block contract and returns a
 * report, without depending on a test framework.
 *
 * Blocks normally call {@link runBlockContract} instead, which turns each rule
 * into a test. The view rules need a DOM, such as the one of happy-dom.
 *
 * @param options - The block, its examples and its documentation.
 * @returns The result of each rule.
 *
 * @example
 * ```ts
 * const report = await checkBlockContract({ definition, view, examples, docs });
 * report.checks.filter((check) => check.failures.length > 0).map((check) => check.id);
 * // ["destroy-cleans-up"]
 * ```
 */
export async function checkBlockContract<M>(
	options: BlockContractOptions<M>,
): Promise<ContractReport> {
	const subject = prepareSubject(options as BlockContractOptions);
	const checks: ContractCheckResult[] = [];
	for (const check of CONTRACT_CHECKS) {
		checks.push({
			id: check.id,
			title: check.title,
			failures: await check.run(subject),
		});
	}
	return {
		passed: checks.every((check) => check.failures.length === 0),
		checks,
	};
}
