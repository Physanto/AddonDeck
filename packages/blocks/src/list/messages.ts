// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockMessages } from "@addondeck/sdk";

/** Codes of the diagnostics of the list block. */
export type ListMessageCode = "LIST-W01" | "LIST-W02" | "LIST-W03" | "LIST-W04";

/** Diagnostics of the list block, in English. */
export const LIST_MESSAGES: BlockMessages<ListMessageCode> = {
	"LIST-W01": {
		severity: "warning",
		message: "The list block takes no `{name}`; it is ignored.",
	},
	"LIST-W02": {
		severity: "warning",
		message:
			"Unknown value `{value}` for `reveal`; use `each` or `all`. Items appear one per step.",
	},
	"LIST-W03": {
		severity: "warning",
		message: "The list has no items.",
	},
	"LIST-W04": {
		severity: "warning",
		message:
			"With `reveal=all` the items have no steps; this step annotation is ignored.",
	},
};
