// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Where a target that followed a path ends, in the units of `transform`. */
export interface PathEnd {
	readonly x: number;
	readonly y: number;
	/** Direction of the path at its end, in degrees. */
	readonly angle: number;
}

/**
 * Computes the end of a motion along a path, the way animated adapters place
 * targets on it: SVG targets in the coordinates of the path, other elements in
 * those of the SVG viewport.
 */
export function pathEnd(path: SVGGeometryElement, target: Element): PathEnd {
	const length = path.getTotalLength();
	const pointAt = (distance: number): DOMPoint =>
		path.getPointAtLength(Math.max(0, Math.min(distance, length)));
	const end = pointAt(length);
	const before = pointAt(length - 1);
	const angle =
		(Math.atan2(end.y - before.y, end.x - before.x) * 180) / Math.PI;
	const matrix = target instanceof SVGElement ? null : path.getCTM();
	if (!matrix) return { x: end.x, y: end.y, angle };
	return {
		x: end.x * matrix.a + end.y * matrix.c + matrix.e,
		y: end.x * matrix.b + end.y * matrix.d + matrix.f,
		angle,
	};
}
