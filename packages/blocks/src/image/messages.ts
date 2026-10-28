// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockMessages } from "@addondeck/sdk";

/** Codes of the diagnostics of the image block. */
export type ImageMessageCode =
	| "IMAGE-E01"
	| "IMAGE-W01"
	| "IMAGE-W02"
	| "IMAGE-W03"
	| "IMAGE-W04";

/** Diagnostics of the image block, in English. */
export const IMAGE_MESSAGES: BlockMessages<ImageMessageCode> = {
	"IMAGE-E01": {
		severity: "error",
		message:
			"The image block needs an image, such as `image src=photo.jpg:` or `image photo.jpg:`.",
	},
	"IMAGE-W01": {
		severity: "warning",
		message: "The image block takes no `{name}`; it is ignored.",
	},
	"IMAGE-W02": {
		severity: "warning",
		message:
			"Unknown value `{value}` for `fit`; use `contain` or `cover`. The whole image is shown.",
	},
	"IMAGE-W03": {
		severity: "warning",
		message:
			'The image has no alt text. Describe it with `alt="…"`, or write `alt=""` if it is only decoration.',
	},
	"IMAGE-W04": {
		severity: "warning",
		message: "The image block has no body; these lines are ignored.",
	},
};
