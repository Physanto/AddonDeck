// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readEmbeddedAssets } from "../assets/read-embedded-assets";
import { reportToConsole } from "../issues/runtime-issue";
import { createTranslator } from "../messages/create-translator";
import {
	createRuntime,
	type Runtime,
	type RuntimeOptions,
} from "./create-runtime";

/** Ids of the elements of an exported page. */
export const PAGE_IDS = {
	root: "addondeck",
	source: "addondeck-source",
	assets: "addondeck-assets",
} as const;

/** What {@link startFromPage} needs besides the page. */
export type StartOptions = Omit<RuntimeOptions, "root" | "source" | "assets">;

/**
 * Shows the deck embedded in a page, as the exporter writes it:
 *
 * ```html
 * <div id="addondeck"></div>
 * <script type="text/addondeck" id="addondeck-source">…deck text…</script>
 * <script type="application/json" id="addondeck-assets">{…}</script>
 * ```
 *
 * The assets element is optional. Unless `options` says otherwise, only
 * errors show on the slides, since the audience sees the page.
 *
 * @returns The running deck, or `null` when the page has no root or no deck
 * text; the problem is reported.
 */
export function startFromPage(
	document: Document,
	options: StartOptions,
): Runtime | null {
	const translate = createTranslator(options.messages);
	const report = options.report ?? reportToConsole;
	const root = document.getElementById(PAGE_IDS.root);
	if (root === null) {
		report({
			severity: "error",
			message: translate("missingRoot", { id: PAGE_IDS.root }),
		});
		return null;
	}
	const source = document.getElementById(PAGE_IDS.source);
	if (source === null) {
		report({
			severity: "error",
			message: translate("missingSource", { id: PAGE_IDS.source }),
		});
		return null;
	}

	const embedded = readEmbeddedAssets(
		document.getElementById(PAGE_IDS.assets)?.textContent ?? "",
	);
	if (embedded.error !== null) {
		report({
			severity: "warning",
			message: translate("invalidAssets", { reason: embedded.error }),
		});
	}
	for (const reference of embedded.invalid) {
		report({
			severity: "warning",
			message: translate("invalidAsset", { reference }),
		});
	}

	return createRuntime({
		problems: "errors",
		...options,
		root,
		source: source.textContent ?? "",
		assets: embedded.assets,
	});
}
