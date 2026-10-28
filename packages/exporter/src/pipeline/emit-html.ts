// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta } from "@addondeck/core";
import {
	escapeHtmlAttribute,
	escapeHtmlText,
} from "../encoding/escape-embedded";
import type { InlinedParts } from "./inline-parts";

/** What the head of the page says about the deck. */
export interface PageInfo {
	readonly meta: DeckMeta;
	/** Title used when the deck has none. */
	readonly untitled: string;
	/** Version of the runtime, for `<meta name="generator">`. */
	readonly version: string;
	/** Attributions the assets' licenses ask for. */
	readonly credits: readonly string[];
}

function meta(name: string, content: string): string {
	return `<meta name="${name}" content="${escapeHtmlAttribute(content)}">`;
}

/**
 * Emit stage: the single HTML page. Its element ids are the ones the
 * runtime's `AddonDeck.start()` looks for.
 */
export function emitHtml(info: PageInfo, parts: InlinedParts): string {
	const title = info.meta.title.trim() === "" ? info.untitled : info.meta.title;
	const head = [
		'<meta charset="utf-8">',
		meta("viewport", "width=device-width, initial-scale=1"),
		meta("generator", `AddonDeck ${info.version}`),
		...(info.meta.author === "" ? [] : [meta("author", info.meta.author)]),
		...(info.credits.length === 0
			? []
			: [meta("addondeck-credits", info.credits.join("; "))]),
		`<title>${escapeHtmlText(title)}</title>`,
		...(parts.styles === "" ? [] : [`<style>\n${parts.styles}\n</style>`]),
	];
	const body = [
		'<div id="addondeck"></div>',
		`<script type="text/addondeck" id="addondeck-source">${parts.source}</script>`,
		...(parts.assets === null
			? []
			: [
					`<script type="application/json" id="addondeck-assets">${parts.assets}</script>`,
				]),
		...parts.scripts.map((code) => `<script>\n${code}\n</script>`),
		"<script>AddonDeck.start();</script>",
	];
	return [
		"<!doctype html>",
		`<html lang="${escapeHtmlAttribute(info.meta.language)}">`,
		"<head>",
		...head,
		"</head>",
		"<body>",
		...body,
		"</body>",
		"</html>",
		"",
	].join("\n");
}
