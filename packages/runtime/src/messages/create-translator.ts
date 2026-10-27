// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { type DiagnosticParams, formatMessage } from "@addondeck/core";
import { EN_RUNTIME_MESSAGES } from "./messages-en";
import type {
	PartialRuntimeMessages,
	RuntimeMessageKey,
} from "./runtime-messages";

/** Renders a runtime message with its parameters. */
export type Translate = (
	key: RuntimeMessageKey,
	params?: DiagnosticParams,
) => string;

/**
 * Creates the function that renders runtime messages in the active language.
 *
 * @param messages - Messages of the active language. Missing ones fall back to English.
 */
export function createTranslator(
	messages: PartialRuntimeMessages = {},
): Translate {
	return (key, params = {}) =>
		formatMessage(messages[key] ?? EN_RUNTIME_MESSAGES[key], params);
}
