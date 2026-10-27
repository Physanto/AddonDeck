// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** A width and a height, in pixels. */
export interface Size {
	readonly width: number;
	readonly height: number;
}

/** Logical size of the stage, in stage pixels. */
export const STAGE_SIZE: Size = { width: 1920, height: 1080 };

/** Where the scaled stage sits inside the viewport, in screen pixels. */
export interface StageFit {
	/** Screen pixels per stage pixel. */
	readonly scale: number;
	/** Width of the band on each side. */
	readonly offsetX: number;
	/** Height of the band above and below. */
	readonly offsetY: number;
}

/**
 * Scales the stage to the largest size that fits the viewport without
 * changing its proportions, centered, with bands on the sides or above and
 * below.
 *
 * @param viewport - Size of the area the deck is shown in, in screen pixels.
 * @param stage - Logical size of the stage.
 * @returns The scale and the size of the bands. A viewport without area, such
 * as a hidden frame, gives scale 0.
 *
 * @example
 * ```ts
 * fitStage({ width: 1000, height: 1000 });
 * // { scale: 0.5208…, offsetX: 0, offsetY: 218.75 }
 * ```
 */
export function fitStage(viewport: Size, stage: Size = STAGE_SIZE): StageFit {
	const scale = Math.min(
		viewport.width / stage.width,
		viewport.height / stage.height,
	);
	if (!Number.isFinite(scale) || scale <= 0) {
		return { scale: 0, offsetX: 0, offsetY: 0 };
	}
	return {
		scale,
		offsetX: (viewport.width - stage.width * scale) / 2,
		offsetY: (viewport.height - stage.height * scale) / 2,
	};
}
