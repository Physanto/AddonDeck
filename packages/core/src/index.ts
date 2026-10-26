// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export {
	type CreateDiagnosticOptions,
	createDiagnostic,
} from "./diagnostics/create-diagnostic";
export type {
	Diagnostic,
	DiagnosticParams,
	DiagnosticSeverity,
} from "./diagnostics/diagnostic";
export {
	DIAGNOSTIC_CODES,
	type DiagnosticCode,
	type DiagnosticParamsOf,
} from "./diagnostics/diagnostic-codes";
export type {
	DiagnosticMessageKey,
	DiagnosticMessages,
	PartialDiagnosticMessages,
} from "./diagnostics/diagnostic-messages";
export { formatMessage } from "./diagnostics/format-message";
export { EN_DIAGNOSTIC_MESSAGES } from "./diagnostics/messages-en";
export type { SourceLocation } from "./model/source-location";
