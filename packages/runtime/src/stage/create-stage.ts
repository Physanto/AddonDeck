// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StageInfo } from "@addondeck/sdk";
import { fitStage, STAGE_SIZE, type StageFit } from "./fit-stage";

/** The stage of a deck: a fixed logical canvas scaled to its viewport. */
export interface Stage {
	/** Fills the root element; the bands are its background. */
	readonly viewport: HTMLElement;
	/** The logical canvas slides are drawn on. */
	readonly element: HTMLElement;
	/** Size and current scale, always up to date. */
	readonly info: StageInfo;
	/** Measures the viewport again and rescales the stage. */
	update(): void;
	/** Removes the stage and stops following the viewport size. */
	destroy(): void;
}

/**
 * Creates the stage inside `root` and keeps it fitted to the viewport.
 *
 * The viewport is followed with a `ResizeObserver` when there is one, so the
 * stage also refits when only its container changes, as in a preview pane;
 * window resizes are followed too.
 */
export function createStage(root: HTMLElement): Stage {
	const document = root.ownerDocument;
	const window = document.defaultView;
	const viewport = document.createElement("div");
	viewport.className = "adk-viewport";
	const element = document.createElement("div");
	element.className = "adk-stage";
	element.style.width = `${STAGE_SIZE.width}px`;
	element.style.height = `${STAGE_SIZE.height}px`;
	viewport.append(element);
	root.append(viewport);

	let fit: StageFit = { scale: 0, offsetX: 0, offsetY: 0 };
	const update = (): void => {
		fit = fitStage({
			width: viewport.clientWidth,
			height: viewport.clientHeight,
		});
		element.style.transform = `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`;
	};

	const observer =
		window?.ResizeObserver === undefined
			? null
			: new window.ResizeObserver(update);
	observer?.observe(viewport);
	window?.addEventListener("resize", update);
	update();

	return {
		viewport,
		element,
		info: {
			width: STAGE_SIZE.width,
			height: STAGE_SIZE.height,
			get scale() {
				return fit.scale;
			},
		},
		update,
		destroy() {
			observer?.disconnect();
			window?.removeEventListener("resize", update);
			viewport.remove();
		},
	};
}
