// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DiagnosticSeverity } from "@addondeck/core";

/**
 * Codes of the exporter's diagnostics. They never change meaning, so tools
 * and language models can rely on them.
 */
export type ExportDiagnosticCode =
	| "EXPORT-E01"
	| "EXPORT-E02"
	| "EXPORT-E03"
	| "EXPORT-E04"
	| "EXPORT-E05"
	| "EXPORT-W01"
	| "EXPORT-W02";

/** Keys of the exporter text catalog: its diagnostics and the page texts. */
export type ExportMessageKey = ExportDiagnosticCode | "untitled";

/**
 * A complete exporter text catalog for one language.
 *
 * Messages are templates: `{name}` is replaced with the parameter `name`.
 */
export type ExportMessages = Readonly<Record<ExportMessageKey, string>>;

/** A catalog from a language pack; missing messages fall back to English. */
export type PartialExportMessages = Partial<ExportMessages>;

/** How serious each exporter diagnostic is. */
export const EXPORT_SEVERITIES: Readonly<
	Record<ExportDiagnosticCode, DiagnosticSeverity>
> = {
	"EXPORT-E01": "error",
	"EXPORT-E02": "error",
	"EXPORT-E03": "error",
	"EXPORT-E04": "error",
	"EXPORT-E05": "error",
	"EXPORT-W01": "warning",
	"EXPORT-W02": "warning",
};
