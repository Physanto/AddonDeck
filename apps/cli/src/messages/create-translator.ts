// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { type DiagnosticParams, formatMessage } from "@addondeck/core";
import type { CliMessageKey, PartialCliMessages } from "./cli-messages";
import { EN_CLI_MESSAGES } from "./messages-en";

/** Renders a command line message with its parameters. */
export type Translate = (
	key: CliMessageKey,
	params?: DiagnosticParams,
) => string;

/**
 * Creates the function that renders command line messages in the active
 * language.
 *
 * @param messages - Messages of the active language. Missing ones fall back to English.
 */
export function createTranslator(messages: PartialCliMessages = {}): Translate {
	return (key, params = {}) =>
		formatMessage(messages[key] ?? EN_CLI_MESSAGES[key], params);
}
