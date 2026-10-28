// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { escapeEmbeddedSource } from "@addondeck/core";
import {
	escapeScript,
	escapeStyle,
	toEmbeddedJson,
} from "../encoding/escape-embedded";
import type { CollectedArtifacts } from "./collect-artifacts";
import type { CollectedAssets } from "./collect-assets";

/** The contents of each element of the page, escaped for it. */
export interface InlinedParts {
	/** Contents of the one `<style>`. */
	readonly styles: string;
	/** Contents of `#addondeck-source`. */
	readonly source: string;
	/** Contents of `#addondeck-assets`, or `null` when the deck embeds no assets. */
	readonly assets: string | null;
	/** One classic script each: the runtime, then the adapters, then the blocks. */
	readonly scripts: readonly string[];
}

/**
 * Inline stage: escapes everything so that no part can close its element
 * (`</` never reaches the page as written) and puts it in page order.
 */
export function inlineParts(
	source: string,
	artifacts: CollectedArtifacts & {
		readonly runtime: NonNullable<CollectedArtifacts["runtime"]>;
	},
	assets: CollectedAssets,
): InlinedParts {
	const { runtime, theme, adapters, blocks } = artifacts;
	const styles = [runtime, theme, ...blocks]
		.map((piece) => piece?.styles ?? null)
		.filter((css) => css !== null)
		.map((css) => escapeStyle(css.trim()));
	const scripts = [runtime, ...adapters, ...blocks]
		.map((piece) => piece.script)
		.filter((code) => code !== null)
		.map((code) => escapeScript(code.trim()));
	return {
		styles: styles.join("\n"),
		source: escapeEmbeddedSource(source),
		assets:
			assets.assets.size === 0
				? null
				: toEmbeddedJson({
						files: Object.fromEntries(assets.files),
						assets: Object.fromEntries(assets.assets),
					}),
		scripts,
	};
}
