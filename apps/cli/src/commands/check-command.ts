// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { resolve } from "node:path";
import type { CliEnvironment } from "../cli-environment";
import { EXIT_CODE, type ExitCode } from "../exit-code";
import type { Translate } from "../messages/create-translator";
import { formatDiagnostics, formatSummary } from "../report/format-diagnostics";
import { createCheckReport } from "../report/json-report";
import { exportFile } from "./export-file";
import { loadDeck } from "./load-deck";
import { reportUsage } from "./report-usage";

/**
 * `addondeck check <file> [--json]`: every problem `build` would report,
 * without writing anything.
 */
export async function checkCommand(
	file: string,
	json: boolean,
	environment: CliEnvironment,
	translate: Translate,
): Promise<ExitCode> {
	const path = resolve(environment.cwd, file);
	const loaded = await loadDeck(path, file);
	if (!loaded.ok) {
		return reportUsage(
			"check",
			json,
			translate(loaded.message, loaded.params),
			environment,
		);
	}
	// Forced, so that problems of the export show up even when the deck text
	// has errors; nothing is written.
	const { diagnostics } = await exportFile(
		path,
		loaded.text,
		{ force: true, watermark: true },
		environment,
	);
	const report = createCheckReport(file, diagnostics);
	if (json) {
		environment.stdout(JSON.stringify(report, null, 2));
	} else {
		for (const line of formatDiagnostics(file, diagnostics, translate)) {
			environment.stdout(line);
		}
		environment.stdout(formatSummary(file, diagnostics, translate));
	}
	return report.ok ? EXIT_CODE.ok : EXIT_CODE.deckErrors;
}
