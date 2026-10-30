// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import type { CliEnvironment } from "../cli-environment";
import { EXIT_CODE, type ExitCode } from "../exit-code";
import { errorCode } from "../io/error-code";
import type { Translate } from "../messages/create-translator";
import { formatDiagnostics, formatSummary } from "../report/format-diagnostics";
import { exportFile } from "./export-file";
import { loadDeck } from "./load-deck";
import { reportUsage } from "./report-usage";

/** What `addondeck build` was asked for. */
export interface BuildRequest {
	readonly file: string;
	/** `null` writes `<name>.html` next to the deck. */
	readonly output: string | null;
	readonly watermark: boolean;
	readonly force: boolean;
}

/** `talk.deck` → `talk.html`, in the same folder. */
function defaultOutput(file: string): string {
	return join(dirname(file), `${basename(file, extname(file))}.html`);
}

function kilobytes(text: string): string {
	return (Buffer.byteLength(text, "utf8") / 1024).toFixed(1);
}

/**
 * `addondeck build <file> [-o output] [--no-watermark] [--force]`: writes the
 * single HTML page of a deck. Problems go to the error output; the line
 * naming the page goes to the standard output.
 */
export async function buildCommand(
	request: BuildRequest,
	environment: CliEnvironment,
	translate: Translate,
): Promise<ExitCode> {
	const { file } = request;
	const path = resolve(environment.cwd, file);
	const output = request.output ?? defaultOutput(file);
	const target = resolve(environment.cwd, output);
	const usage = (message: string): ExitCode =>
		reportUsage("build", false, message, environment);
	if (target === path) {
		return usage(translate("outputIsInput", { file }));
	}
	const loaded = await loadDeck(path, file);
	if (!loaded.ok) return usage(translate(loaded.message, loaded.params));

	const result = await exportFile(path, loaded.text, request, environment);
	const { diagnostics } = result;
	for (const line of formatDiagnostics(file, diagnostics, translate)) {
		environment.stderr(line);
	}
	if (diagnostics.some((diagnostic) => diagnostic.severity !== "info")) {
		environment.stderr(formatSummary(file, diagnostics, translate));
	}
	if (!result.ok) {
		environment.stderr(translate("notWritten"));
		return EXIT_CODE.deckErrors;
	}

	try {
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, result.html, "utf8");
	} catch (thrown) {
		return usage(
			translate("unwritableOutput", {
				file: output,
				reason: errorCode(thrown),
			}),
		);
	}
	const errors = diagnostics.some(
		(diagnostic) => diagnostic.severity === "error",
	);
	environment.stdout(
		translate(errors ? "wroteDespiteErrors" : "wrote", {
			file: output,
			size: kilobytes(result.html),
		}),
	);
	return errors ? EXIT_CODE.deckErrors : EXIT_CODE.ok;
}
