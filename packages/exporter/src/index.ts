// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export {
	type ArtifactManifest,
	type ArtifactPiece,
	type ArtifactPieceKind,
	MANIFEST_FILE,
	MANIFEST_VERSION,
	readArtifactManifest,
} from "./artifacts/artifact-manifest";
export { exportDeck } from "./export-deck";
export type { ExportIO, ExportOptions, ExportResult } from "./export-options";
export type { ArtifactSource } from "./io/artifact-source";
export type {
	AssetFile,
	AssetResolver,
	EmbeddedAssetKind,
} from "./io/asset-resolver";
export type {
	ExportDiagnosticCode,
	ExportMessageKey,
	ExportMessages,
	PartialExportMessages,
} from "./messages/export-messages";
export { EN_EXPORT_MESSAGES } from "./messages/messages-en";
export type { AssetUse, DeckAnalysis } from "./pipeline/deck-analysis";
