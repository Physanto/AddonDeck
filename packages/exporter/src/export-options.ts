// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	BlockRegistry,
	Diagnostic,
	PartialDiagnosticMessages,
} from "@addondeck/core";
import type { ArtifactSource } from "./io/artifact-source";
import type { AssetResolver } from "./io/asset-resolver";
import type { PartialExportMessages } from "./messages/export-messages";
import type { DeckAnalysis } from "./pipeline/deck-analysis";

/** How to export a deck. */
export interface ExportOptions {
	/**
	 * The block definitions to parse the deck with. Their `needs` and `assets`
	 * decide which adapters and assets the page includes.
	 */
	readonly registry: BlockRegistry;
	/**
	 * Exports although there are errors. Without the runtime nothing can be
	 * exported, even so.
	 */
	readonly force?: boolean;
	/**
	 * `false` hides the watermark whatever the deck's `watermark:` says. The
	 * deck text is embedded unchanged; the page asks the runtime instead.
	 */
	readonly watermark?: boolean;
	/** Exporter messages of the active language. */
	readonly messages?: PartialExportMessages;
	/** Parser messages of the active language. */
	readonly diagnosticMessages?: PartialDiagnosticMessages;
}

/** Where the exporter reads from; the exporter itself touches no files. */
export interface ExportIO {
	readonly artifacts: ArtifactSource;
	readonly assets: AssetResolver;
}

/**
 * The result of an export. Diagnostics are those of the deck text followed by
 * those of the export; the ones that are not about the text, such as a
 * missing artifact, have line and column 0.
 */
export type ExportResult =
	| {
			readonly ok: true;
			/** The page, ready to save as `index.html`. */
			readonly html: string;
			readonly diagnostics: readonly Diagnostic[];
			readonly analysis: DeckAnalysis;
	  }
	| {
			readonly ok: false;
			readonly diagnostics: readonly Diagnostic[];
			readonly analysis: DeckAnalysis;
	  };
