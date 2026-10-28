// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ExportMessages } from "./export-messages";

/** English exporter messages, the fallback for every other language. */
export const EN_EXPORT_MESSAGES: ExportMessages = {
	"EXPORT-E01":
		"No runtime script was found in {packages}, so nothing can be exported. Build the runtime first.",
	"EXPORT-E02": "The artifacts of {package} cannot be used: {reason}.",
	"EXPORT-E03":
		"No script was found for the {type} block, so the exported deck cannot draw it.",
	"EXPORT-E04":
		'No script was found for the "{adapter}" adapter, which the deck needs.',
	"EXPORT-E05": "The file {path} of {package} cannot be read.",
	"EXPORT-W01":
		'The asset "{reference}" was not found; the exported deck shows a frame in its place.',
	"EXPORT-W02":
		"The {type} block could not list its assets ({reason}), so none are embedded for it.",
	untitled: "Untitled deck",
};
