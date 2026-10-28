// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockRegistry,
	type ParseOutput,
	type PartialDiagnosticMessages,
	parse,
} from "@addondeck/core";

/** Parse stage: the deck and the problems of its text. */
export function parseDeck(
	source: string,
	registry: BlockRegistry,
	messages?: PartialDiagnosticMessages,
): ParseOutput {
	return parse(source, {
		registry,
		...(messages === undefined ? {} : { messages }),
	});
}
