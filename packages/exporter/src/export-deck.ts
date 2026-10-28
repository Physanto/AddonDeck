// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "@addondeck/core";
import type { ExportIO, ExportOptions, ExportResult } from "./export-options";
import { createExportDiagnostics } from "./messages/create-export-diagnostic";
import { EN_EXPORT_MESSAGES } from "./messages/messages-en";
import { analyzeDeck } from "./pipeline/analyze-deck";
import { collectArtifacts } from "./pipeline/collect-artifacts";
import { collectAssets } from "./pipeline/collect-assets";
import { emitHtml } from "./pipeline/emit-html";
import { inlineParts } from "./pipeline/inline-parts";
import { parseDeck } from "./pipeline/parse-deck";

function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
	return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

/**
 * Turns `.deck` text into a single HTML page that opens with a double click.
 *
 * The page carries the deck text, so it can be opened again for editing, the
 * runtime, and only the blocks, adapters, styles and assets the deck uses.
 * It runs in the browser and in Node.js alike: everything it reads comes
 * through `io`.
 *
 * Errors in the deck, or missing artifacts, stop the export unless `force`
 * is set; a missing runtime always does.
 *
 * @param source - The `.deck` text.
 *
 * @example
 * ```ts
 * const result = await exportDeck(text, { registry }, { artifacts, assets });
 * if (result.ok) await save("index.html", result.html);
 * else for (const d of result.diagnostics) console.error(d.message);
 * ```
 */
export async function exportDeck(
	source: string,
	options: ExportOptions,
	io: ExportIO,
): Promise<ExportResult> {
	const diagnostic = createExportDiagnostics(options.messages);
	const force = options.force === true;
	const parsed = parseDeck(
		source,
		options.registry,
		options.diagnosticMessages,
	);
	const analyzed = analyzeDeck(parsed.deck, options.registry, diagnostic);
	const { analysis } = analyzed;
	const found = [...parsed.diagnostics, ...analyzed.diagnostics];
	if (!force && hasErrors(found)) {
		return { ok: false, diagnostics: found, analysis };
	}

	const [artifacts, assets] = await Promise.all([
		collectArtifacts(analysis, io.artifacts, diagnostic),
		collectAssets(analysis.assets, io.assets, diagnostic),
	]);
	const diagnostics = [
		...found,
		...artifacts.diagnostics,
		...assets.diagnostics,
	];
	const { runtime } = artifacts;
	if (runtime === null || (!force && hasErrors(diagnostics))) {
		return { ok: false, diagnostics, analysis };
	}

	const credits = [
		...new Set(
			[...assets.assets.values()].flatMap((asset) =>
				asset.credit === undefined ? [] : [asset.credit],
			),
		),
	];
	const html = emitHtml(
		{
			meta: parsed.deck.meta,
			untitled: options.messages?.untitled ?? EN_EXPORT_MESSAGES.untitled,
			version: runtime.version,
			credits,
			watermark: options.watermark !== false,
		},
		inlineParts(source, { ...artifacts, runtime }, assets),
	);
	return { ok: true, html, diagnostics, analysis };
}
