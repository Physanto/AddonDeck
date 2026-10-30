// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { dirname } from "node:path";
import { BLOCK_DEFINITIONS } from "@addondeck/blocks";
import { createBlockRegistry } from "@addondeck/core";
import { type ExportResult, exportDeck } from "@addondeck/exporter";
import type { CliEnvironment } from "../cli-environment";
import { createLocalAssetResolver } from "../io/local-asset-resolver";
import { createNodeArtifactSource } from "../io/node-artifact-source";

/**
 * Exports a deck file with the built-in blocks, the installed artifacts and
 * the images of the deck's folder. `check` and `build` share it, so they
 * report the same problems.
 *
 * @param path - Absolute path of the deck file.
 */
export function exportFile(
	path: string,
	text: string,
	options: { readonly force: boolean; readonly watermark: boolean },
	environment: CliEnvironment,
): Promise<ExportResult> {
	return exportDeck(
		text,
		{
			registry: createBlockRegistry(BLOCK_DEFINITIONS),
			force: options.force,
			watermark: options.watermark,
			...(environment.exportMessages === undefined
				? {}
				: { messages: environment.exportMessages }),
			...(environment.diagnosticMessages === undefined
				? {}
				: { diagnosticMessages: environment.diagnosticMessages }),
		},
		{
			artifacts: environment.artifacts ?? createNodeArtifactSource(),
			assets: createLocalAssetResolver(dirname(path)),
		},
	);
}
