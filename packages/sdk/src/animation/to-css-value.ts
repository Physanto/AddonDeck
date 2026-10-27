// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const UNITLESS: ReadonlySet<string> = new Set([
	"opacity",
	"zIndex",
	"fontWeight",
	"lineHeight",
	"flex",
	"flexGrow",
	"flexShrink",
	"order",
	"scale",
	"draw",
]);

/**
 * Writes a value of `AnimationProps` as CSS, adding the default unit of
 * its property to numbers.
 *
 * Animators share this rule so that the same props end in the same styles
 * whatever animator applies them.
 *
 * @param property - Key of the value in `AnimationProps`.
 * @param value - A number, or a string that is returned as written.
 * @returns The value with its unit: `"40px"` for `x`, `"90deg"` for `rotate`,
 * `"0.5"` for `opacity` or a custom property.
 *
 * @example
 * ```ts
 * toCssValue("width", 120); // "120px"
 * toCssValue("rotate", 90); // "90deg"
 * toCssValue("--progress", 0.5); // "0.5"
 * ```
 */
export function toCssValue(property: string, value: number | string): string {
	if (typeof value === "string") return value;
	if (property === "rotate") return `${value}deg`;
	if (UNITLESS.has(property) || property.startsWith("--")) return String(value);
	return `${value}px`;
}
