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
 * custom properties (`--progress`) and the transform shorthands `x`, `y`,
 * `scale` and `rotate`, which combine into one `transform` and keep the
 * values of the shorthands an earlier animation set.
 *
 * @example
 * ```ts
 * const props: AnimationProps = { opacity: [0, 1], x: 40, backgroundColor: "var(--color-accent)" };
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
