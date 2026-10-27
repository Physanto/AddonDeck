// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Payload of `slide:enter` and `slide:leave`. */
export interface SlideEvent {
	/** Index of the slide, starting at 0. */
	readonly slide: number;
}

/** Payload of `step:change`. */
export interface StepChangeEvent {
	/** Index of the current slide, starting at 0. */
	readonly slide: number;
	/** Clicks of the slide already played, from 0. */
	readonly step: number;
}

/**
 * The events the runtime emits, by name, with their payloads.
 *
 * When the presenter moves to another slide, `slide:leave` comes first, then
 * `slide:enter` and then `step:change`; a click inside a slide only emits
 * `step:change`. The first slide shown emits `slide:enter` alone.
 */
export interface RuntimeEvents {
	/** A slide became the current one. */
	readonly "slide:enter": SlideEvent;
	/** The current slide is about to stop being the current one. */
	readonly "slide:leave": SlideEvent;
	/** The position changed: another click or another slide. */
	readonly "step:change": StepChangeEvent;
}

/** Name of an event the runtime emits. */
export type RuntimeEventName = keyof RuntimeEvents;
