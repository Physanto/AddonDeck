// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// The pure contracts live in core, which the parser needs and which cannot
// depend on this package; they are re-exported so a block imports everything
// from here.
export type {
	AdapterKind,
	BlockDefinition,
	BlockOption,
	BlockSource,
	Diagnostic,
	DiagnosticParams,
	DiagnosticSeverity,
	ExtractStepAnnotationsOptions,
	ParseResult,
	SourceLine,
	SourceLocation,
	StepAnnotation,
	StepAnnotationResult,
	StepDef,
} from "@addondeck/core";
export { extractStepAnnotations, normalizeKeyword } from "@addondeck/core";
export type {
	Chart,
	ChartData,
	ChartKind,
	ChartRenderer,
	ChartSeries,
} from "./adapters/chart-renderer";
export type {
	HighlightedLine,
	Highlighter,
	HighlightToken,
} from "./adapters/highlighter";
export type {
	PhysicsBodyOptions,
	PhysicsBodyState,
	PhysicsSnapshot,
	PhysicsWorld,
} from "./adapters/physics-world";
export type { Animation } from "./animation/animation";
export type {
	AnimationOptions,
	TimelineStepOptions,
} from "./animation/animation-options";
export type {
	AnimationProps,
	AnimationTarget,
	AnimationValue,
	DelayFunction,
} from "./animation/animation-props";
export type { Animator } from "./animation/animator";
export { createInstantAnimator } from "./animation/create-instant-animator";
export { EASINGS, type Easing } from "./animation/easing";
export type { MotionPath } from "./animation/motion-path";
export { type StaggerFrom, stagger } from "./animation/stagger";
export { getStrokeDraw, setStrokeDraw } from "./animation/stroke-draw";
export type { Timeline } from "./animation/timeline";
export { toCssValue } from "./animation/to-css-value";
export type { BlockContext } from "./block/block-context";
export type { BlockInstance } from "./block/block-instance";
export type { BlockView } from "./block/block-view";
export type { Box } from "./block/box";
export type {
	AdapterEnvironment,
	AdapterPlugin,
	AdapterPluginOf,
	AdapterServices,
	BlockPlugin,
	Plugin,
} from "./plugin/plugin";
export type {
	ActorHandle,
	ParamSchema,
	SceneContext,
	StepAnimation,
	VerbParam,
	VerbParamKind,
	VerbPlugin,
} from "./scene/verb-plugin";
export type {
	AssetKind,
	AssetResolver,
	ResolvedAsset,
} from "./services/asset-resolver";
export type {
	EventBus,
	EventHandler,
	Unsubscribe,
} from "./services/event-bus";
export type { MotionTokens } from "./services/motion-tokens";
export type { StageInfo } from "./services/stage-info";
export type {
	ThemeColors,
	ThemeFonts,
	ThemeTokens,
} from "./services/theme-tokens";
