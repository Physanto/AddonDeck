// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Elements an animation acts on: one element or several, animated alike. */
export type AnimationTarget = Element | readonly Element[];

/**
 * The value a property animates to, or a `[from, to]` pair.
 *
 * Numbers get the property's default unit: pixels for lengths and for `x`
 * and `y`, degrees for `rotate`, none for `opacity` and `scale`. Strings are
 * used as written, such as `"50%"` or `"var(--color-primary)"`.
 */
export type AnimationValue =
	| number
	| string
	| readonly [from: number | string, to: number | string];

/**
 * Properties to animate.
 *
 * Keys are CSS properties in camelCase (`opacity`, `backgroundColor`), CSS
 * custom properties (`--progress`) and two kinds of shorthands:
 *
 * - `x`, `y`, `scale` and `rotate` combine into one `transform`, written in
 *   that order (translate, rotate, scale) and keeping the values that earlier
 *   animations set. Other transform functions already written are kept.
 * - `draw` is the part of an SVG stroke that is drawn, from its start: `0`
 *   hides the line and `1` shows all of it. It takes over the
 *   `stroke-dasharray` of the element; elements that are not SVG shapes ignore it.
 *
 * @example
 * ```ts
 * const props: AnimationProps = { opacity: [0, 1], x: 40, backgroundColor: "var(--color-accent)" };
 * const reveal: AnimationProps = { draw: [0, 1] };
 * ```
 */
export type AnimationProps = Readonly<Record<string, AnimationValue>>;

/**
 * Delay of each target, for staggered animations.
 *
 * @param index - Position of the target, starting at 0.
 * @param count - Number of targets.
 * @returns The delay of that target, in milliseconds.
 */
export type DelayFunction = (index: number, count: number) => number;
