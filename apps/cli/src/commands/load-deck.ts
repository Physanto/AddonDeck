// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readFile } from "node:fs/promises";
import type { DiagnosticParams } from "@addondeck/core";
import { errorCode } from "../io/error-code";
import type { CliMessageKey } from "../messages/cli-messages";

/** The text of a deck file, or why it cannot be read. */
export type LoadedDeck =
	| { readonly ok: true; readonly text: string }
	| {
			readonly ok: false;
			readonly message: CliMessageKey;
			readonly params: DiagnosticParams;
	  };

/**
 * Reads a deck file as UTF-8.
 *
 * @param path - Absolute path of the file.
 * @param shown - The path as the user wrote it, for the messages.
 */
export async function loadDeck(
	path: string,
	shown: string,
): Promise<LoadedDeck> {
	try {
		return { ok: true, text: await readFile(path, "utf8") };
	} catch (thrown) {
		const code = errorCode(thrown);
		return code === "ENOENT"
			? { ok: false, message: "fileNotFound", params: { file: shown } }
			: {
					ok: false,
					message: "unreadableFile",
					params: { file: shown, reason: code },
				};
	}
}
