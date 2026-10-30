// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { EXPORTED, exampleDecks, REPOSITORY } from "./examples";

const CLI = join(REPOSITORY, "apps", "cli", "dist", "cli.js");

/**
 * Exports every example deck with the built `addondeck` command, as a user
 * would, so the pages hold the real runtime, blocks and adapters.
 */
export default function exportExamples(): void {
	if (!existsSync(CLI)) {
		throw new Error(`${CLI} is missing: run "pnpm build" first.`);
	}
	rmSync(EXPORTED, { recursive: true, force: true });
	mkdirSync(EXPORTED, { recursive: true });
	for (const name of exampleDecks()) {
		const result = spawnSync(
			process.execPath,
			[
				CLI,
				"build",
				join("examples", `${name}.deck`),
				"-o",
				join(EXPORTED, `${name}.html`),
			],
			{ cwd: REPOSITORY, encoding: "utf8" },
		);
		if (result.status !== 0) {
			throw new Error(
				`addondeck build examples/${name}.deck ended with ${result.status}:\n${result.stderr}`,
			);
		}
	}
}
