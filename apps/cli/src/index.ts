// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export type { CliEnvironment } from "./cli-environment";
export { EXIT_CODE, type ExitCode } from "./exit-code";
export {
	ASSET_FOLDERS,
	createLocalAssetResolver,
} from "./io/local-asset-resolver";
export {
	ARTIFACT_PACKAGES,
	createNodeArtifactSource,
	locateInstalledArtifacts,
	type NodeArtifactSourceOptions,
} from "./io/node-artifact-source";
export type {
	CliMessageKey,
	CliMessages,
	PartialCliMessages,
} from "./messages/cli-messages";
export { EN_CLI_MESSAGES } from "./messages/messages-en";
export {
	type CheckReport,
	REPORT_SCHEMA,
	type ReportDiagnostic,
	type ReportSummary,
	type UsageReport,
} from "./report/json-report";
export { run } from "./run";

/** npm name of this package. */
export const PACKAGE_NAME = "@addondeck/cli";
