// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { FORMAT_VERSION } from "../model/defaults";

/** Rewrites deck text written for format version `from` as text for version `from + 1`. */
export interface FormatMigration {
	readonly from: number;
	migrate(lines: readonly string[]): readonly string[];
}

/**
 * Migrations from earlier format versions, oldest first. Format 1 is the first
 * version, so there are none yet; a future major version adds one here and the
 * parser keeps reading older decks.
 */
export const FORMAT_MIGRATIONS: readonly FormatMigration[] = [];

/**
 * Applies, in order, every migration from the declared version up to the
 * current one. Returns the same lines when none applies.
 */
export function migrateToCurrent(
	lines: readonly string[],
	declaredFormat: number | null,
	migrations: readonly FormatMigration[] = FORMAT_MIGRATIONS,
): readonly string[] {
	if (declaredFormat === null) return lines;
	let result = lines;
	for (const migration of migrations) {
		if (migration.from >= declaredFormat && migration.from < FORMAT_VERSION) {
			result = migration.migrate(result);
		}
	}
	return result;
}
