// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** The rules of the block contract, in the order the suite checks them. */
export const CONTRACT_CHECK_IDS = [
	"parse-never-throws",
	"diagnostics-have-lines",
	"steps-are-valid",
	"view-matches-definition",
	"mount-shows-step-zero",
	"set-state-is-idempotent",
	"play-matches-set-state",
	"set-state-goes-back",
	"destroy-cleans-up",
	"docs-exist",
	"examples-are-valid",
	"translations-exist",
] as const;

/** One rule of the block contract. */
export type ContractCheckId = (typeof CONTRACT_CHECK_IDS)[number];
