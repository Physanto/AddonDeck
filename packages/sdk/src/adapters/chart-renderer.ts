// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Box } from "../block/box";

/**
 * Kinds of chart.
 *
 * @experimental Settled together with the charts adapter; it may change until then.
 */
export type ChartKind = "bar" | "line" | "area" | "pie" | "scatter";

/**
 * One named series of values.
 *
 * @experimental Settled together with the charts adapter; it may change until then.
 */
export interface ChartSeries {
	readonly name: string;
	/** One value per category; `null` leaves a gap. */
	readonly values: readonly (number | null)[];
}

/**
 * What a chart shows. Colors come from the theme.
 *
 * @experimental Settled together with the charts adapter; it may change until then.
 */
export interface ChartData {
	readonly kind: ChartKind;
	/** Labels of the horizontal axis, or of the slices of a pie. */
	readonly categories: readonly string[];
	readonly series: readonly ChartSeries[];
}

/**
 * A chart drawn in an element.
 *
 * @experimental Settled together with the charts adapter; it may change until then.
 */
export interface Chart {
	/** Shows new data, animating the change unless `animate` is `false`. */
	update(
		data: ChartData,
		options?: { readonly animate?: boolean },
	): Promise<void>;
	/** Redraws the chart for a new size of its element. */
	resize(box: Box): void;
	/** Removes the chart and frees what the library holds; the chart is not used afterwards. */
	destroy(): void;
}

/**
 * Draws charts with a chart library.
 *
 * @experimental Settled together with the charts adapter; it may change until then.
 */
export interface ChartRenderer {
	/** Draws a chart inside `el`, without animation. */
	render(el: HTMLElement, data: ChartData): Chart;
}
