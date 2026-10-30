// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockRegistry,
	compileStepPlan,
	type Deck,
	type Diagnostic,
	type PartialDiagnosticMessages,
	parse,
} from "@addondeck/core";

/**
 * Parse stage: the deck and the problems of its text, those of the parser
 * followed by those of the step plans, as the runtime finds them too.
 */
export function parseDeck(
	source: string,
	registry: BlockRegistry,
	messages?: PartialDiagnosticMessages,
): { readonly deck: Deck; readonly diagnostics: readonly Diagnostic[] } {
	const options = messages === undefined ? {} : { messages };
	const parsed = parse(source, { registry, ...options });
	const steps = parsed.deck.slides.flatMap(
		(slide) => compileStepPlan(slide, registry, options).diagnostics,
	);
	return {
		deck: parsed.deck,
		diagnostics: [...parsed.diagnostics, ...steps],
	};
}
