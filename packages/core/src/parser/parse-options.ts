// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "../diagnostics/diagnostic";
import type { PartialDiagnosticMessages } from "../diagnostics/diagnostic-messages";
import type { Deck } from "../model/deck";
import type { BlockRegistry } from "../registry/block-registry";

/**
 * Names of what is installed, to check header values and slide options
 * against. A list that is not given is not checked.
 */
export interface InstalledResources {
	readonly themes?: readonly string[];
	readonly fonts?: readonly string[];
	readonly backgrounds?: readonly string[];
}

/** What {@link parse} needs besides the text. */
export interface ParseOptions {
	/** The installed blocks. Lines naming any other block are text. */
	readonly registry: BlockRegistry;
	/** Messages of the active language. Missing ones fall back to English. */
	readonly messages?: PartialDiagnosticMessages;
	readonly installed?: InstalledResources;
}

/** The result of {@link parse}: always a deck, plus what went wrong. */
export interface ParseOutput {
	readonly deck: Deck;
	/** Every diagnostic, sorted by line and column. */
	readonly diagnostics: readonly Diagnostic[];
}
