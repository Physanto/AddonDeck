// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * An SVG path that targets move along.
 *
 * Targets are placed with `transform` at the points of the path. A target
 * inside the same SVG uses the coordinates of the path; any other element uses
 * the coordinates of the SVG viewport, so it should be laid out at the top
 * left corner of the SVG.
 *
 * @example
 * ```ts
 * ctx.animator.animate(packet, {}, { path: { element: wire, rotate: true } });
 * ```
 */
export interface MotionPath {
	/** The shape to follow, usually a `<path>`. */
	readonly element: SVGGeometryElement;
	/** Turns the targets to follow the direction of the path. Defaults to `false`. */
	readonly rotate?: boolean;
}
