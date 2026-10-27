// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export {
	type EmbeddedAssets,
	type EmbeddedAssetsResult,
	readEmbeddedAssets,
} from "./assets/read-embedded-assets";
export {
	DEFAULT_MOTION_TOKENS,
	DEFAULT_THEME_TOKENS,
} from "./context/default-tokens";
export {
	type IssueReporter,
	type RuntimeIssue,
	reportToConsole,
} from "./issues/runtime-issue";
export { EN_RUNTIME_MESSAGES } from "./messages/messages-en";
export type {
	PartialRuntimeMessages,
	RuntimeMessageKey,
	RuntimeMessages,
} from "./messages/runtime-messages";
export {
	createNavigator,
	type Navigator,
	type PositionListener,
} from "./navigation/create-navigator";
export { formatDeckHash, parseDeckHash } from "./navigation/deck-hash";
export type { DeckPosition } from "./navigation/deck-position";
export { createPluginRegistry } from "./registry/create-plugin-registry";
export type { PluginRegistry } from "./registry/plugin-registry";
export {
	arrangeSlide,
	type SlideArrangement,
	type SlideFlow,
} from "./slides/arrange-slide";
export type { Stage } from "./stage/create-stage";
export {
	fitStage,
	type Size,
	STAGE_SIZE,
	type StageFit,
} from "./stage/fit-stage";
export {
	createRuntime,
	type Runtime,
	type RuntimeOptions,
} from "./start/create-runtime";
export {
	PAGE_IDS,
	type StartOptions,
	startFromPage,
} from "./start/start-from-page";
