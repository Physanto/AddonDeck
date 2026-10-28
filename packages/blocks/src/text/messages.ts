// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockMessages } from "@addondeck/sdk";

/** Diagnostics of the text block, in English. */
export const TEXT_MESSAGES: BlockMessages<"TEXT-W01"> = {
	"TEXT-W01": {
		severity: "warning",
		message: "The text block takes no `{name}`; it is ignored.",
	},
};
