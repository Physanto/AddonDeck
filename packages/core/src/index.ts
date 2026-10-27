// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export {
	type ExtractStepAnnotationsOptions,
	extractStepAnnotations,
	type StepAnnotationResult,
} from "./annotations/extract-step-annotations";
export type { AdapterKind } from "./contracts/adapter-kind";
export type { BlockDefinition } from "./contracts/block-definition";
export type { BlockOption } from "./contracts/block-option";
export type { BlockSource } from "./contracts/block-source";
export type { ParseResult } from "./contracts/parse-result";
export type { StepDef } from "./contracts/step-def";
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
export type { BlockNode } from "./model/block-node";
export type { Deck } from "./model/deck";
export type {
	DeckMeta,
	HeaderEntry,
	HeaderKey,
	MotionPersonality,
} from "./model/deck-meta";
export {
	DEFAULT_DECK_META,
	DEFAULT_SLIDE_OPTIONS,
	FORMAT_VERSION,
	HEADER_KEYS,
	MOTION_PERSONALITIES,
	SLIDE_LAYOUTS,
	SLIDE_TRANSITIONS,
} from "./model/defaults";
export type { Section } from "./model/section";
export type { Slide } from "./model/slide";
export type { SlideNode } from "./model/slide-node";
export type {
	SlideLayout,
	SlideOptions,
	SlideTransition,
} from "./model/slide-options";
export type { SourceLine } from "./model/source-line";
export type { SourceLocation } from "./model/source-location";
export type { SpeakerNotes } from "./model/speaker-notes";
export type { StepAnnotation } from "./model/step-annotation";
export type { TextNode } from "./model/text-node";
export { parse } from "./parser/parse";
export type {
	InstalledResources,
	ParseOptions,
	ParseOutput,
} from "./parser/parse-options";
export type { BlockRegistry } from "./registry/block-registry";
export {
	type CreateBlockRegistryOptions,
	createBlockRegistry,
} from "./registry/create-block-registry";
export type { LanguagePack } from "./registry/language-pack";
export {
	type CompileStepPlanOptions,
	compileStepPlan,
} from "./steps/compile-step-plan";
export type { StepAdvance, StepClick, StepPlan } from "./steps/step-plan";
export {
	closestKeyword,
	MAX_SUGGESTION_DISTANCE,
} from "./text/closest-keyword";
export { normalizeKeyword } from "./text/normalize-keyword";
