// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { fitStage, STAGE_SIZE } from "./fit-stage";

describe("fitStage", () => {
	it("fills a viewport with the stage proportions, without bands", () => {
		expect(fitStage({ width: 960, height: 540 })).toEqual({
			scale: 0.5,
			offsetX: 0,
			offsetY: 0,
		});
		expect(fitStage({ width: 3840, height: 2160 }).scale).toBe(2);
	});

	it("adds bands on the sides of a wider viewport", () => {
		expect(fitStage({ width: 2400, height: 1080 })).toEqual({
			scale: 1,
			offsetX: 240,
			offsetY: 0,
		});
	});

	it("adds bands above and below a taller viewport", () => {
		expect(fitStage({ width: 960, height: 1000 })).toEqual({
			scale: 0.5,
			offsetX: 0,
			offsetY: 230,
		});
	});

	it("keeps the scaled stage centered and inside the viewport", () => {
		for (const viewport of [
			{ width: 1366, height: 768 },
			{ width: 390, height: 844 },
			{ width: 1024, height: 1366 },
			{ width: 3440, height: 1440 },
		]) {
			const { scale, offsetX, offsetY } = fitStage(viewport);
			const width = STAGE_SIZE.width * scale;
			const height = STAGE_SIZE.height * scale;
			expect(offsetX).toBeGreaterThanOrEqual(0);
			expect(offsetY).toBeGreaterThanOrEqual(0);
			expect(offsetX * 2 + width).toBeCloseTo(viewport.width);
			expect(offsetY * 2 + height).toBeCloseTo(viewport.height);
			expect(Math.min(offsetX, offsetY)).toBe(0);
		}
	});

	it("scales a stage of another size", () => {
		expect(
			fitStage({ width: 800, height: 800 }, { width: 400, height: 200 }),
		).toEqual({ scale: 2, offsetX: 0, offsetY: 200 });
	});

	it("gives scale 0 to a viewport without area", () => {
		const none = { scale: 0, offsetX: 0, offsetY: 0 };
		expect(fitStage({ width: 0, height: 0 })).toEqual(none);
		expect(fitStage({ width: 800, height: 0 })).toEqual(none);
		expect(fitStage({ width: -10, height: 600 })).toEqual(none);
	});
});
