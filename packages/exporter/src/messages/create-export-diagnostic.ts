// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Diagnostic,
	type DiagnosticParams,
	formatMessage,
	type SourceLocation,
} from "@addondeck/core";
import {
	EXPORT_SEVERITIES,
	type ExportDiagnosticCode,
	type PartialExportMessages,
} from "./export-messages";
import { EN_EXPORT_MESSAGES } from "./messages-en";

/**
 * Where a problem that is not in the deck text, such as a missing artifact,
 * is placed: line and column 0.
 */
export const NO_LOCATION: SourceLocation = { line: 0, column: 0 };

/** Creates exporter diagnostics in the active language. */
export type ExportDiagnosticFactory = (
	code: ExportDiagnosticCode,
	params?: DiagnosticParams,
	location?: SourceLocation,
) => Diagnostic;

/**
 * @param messages - Messages of the active language. Missing ones fall back to English.
 */
export function createExportDiagnostics(
	messages: PartialExportMessages = {},
): ExportDiagnosticFactory {
	return (code, params = {}, location = NO_LOCATION) => ({
		severity: EXPORT_SEVERITIES[code],
		code,
		line: location.line,
		column: location.column,
		message: formatMessage(messages[code] ?? EN_EXPORT_MESSAGES[code], params),
		params,
	});
}
