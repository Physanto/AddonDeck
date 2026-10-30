// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The root of the repository. */
export const REPOSITORY = join(import.meta.dirname, "..");

/** The example decks of the repository, by name without `.deck`. */
export function exampleDecks(): string[] {
	return readdirSync(join(REPOSITORY, "examples"))
		.filter((name) => name.endsWith(".deck"))
		.map((name) => name.slice(0, -".deck".length))
		.sort();
}

/** Where the exported pages are written, one `<name>.html` per example. */
export const EXPORTED = join(tmpdir(), "addondeck-e2e");
