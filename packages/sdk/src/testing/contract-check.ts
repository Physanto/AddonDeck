// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ContractCheckId } from "./contract-check-id";
import type { ContractSubject } from "./contract-subject";

/** One rule of the block contract and how to check it. */
export interface ContractCheck {
	readonly id: ContractCheckId;
	/** Describes the expected behavior; used as the test name. */
	readonly title: string;
	/** @returns One message per problem found; empty when the block follows the rule. */
	run(subject: ContractSubject): Promise<readonly string[]>;
}
