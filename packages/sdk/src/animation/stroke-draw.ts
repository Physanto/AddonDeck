// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * With this `pathLength`, dash lengths are fractions of the stroke, so drawing
 * needs no measuring and works the same before the shape is laid out.
 */
const PATH_LENGTH = "1";

function isDrawable(element: Element): element is SVGGeometryElement {
	return "getTotalLength" in element && "style" in element;
}

/**
 * Reads how much of an SVG stroke is drawn, as the `draw` shorthand left it.
 *
 * @param element - An SVG shape; any other element counts as fully drawn.
 * @returns The part drawn from the start of the stroke, from 0 to 1; 1 for a
 * stroke that was never drawn partially.
 */
export function getStrokeDraw(element: Element): number {
	if (
		!isDrawable(element) ||
		element.getAttribute("pathLength") !== PATH_LENGTH
	) {
		return 1;
	}
	const dash = Number.parseFloat(
		element.style.getPropertyValue("stroke-dasharray"),
	);
	return Number.isFinite(dash) ? dash : 1;
}

/**
 * Draws part of an SVG stroke, from its start; the value of the `draw` shorthand.
 *
 * It sets `pathLength` and the inline `stroke-dasharray`. A stroke with
 * nothing drawn also gets a `butt` line cap, because round and square caps
 * would still paint a dot; drawing it again removes an inline `butt` cap.
 *
 * @param element - An SVG shape; other elements are left as they are.
 * @param drawn - The part to draw, from 0 (nothing) to 1 (all of it).
 *
 * @example
 * ```ts
 * setStrokeDraw(line, 0.5); // the first half of the line is visible
 * getStrokeDraw(line); // 0.5
 * ```
 */
export function setStrokeDraw(element: Element, drawn: number): void {
	if (!isDrawable(element)) return;
	const part = Math.min(1, Math.max(0, drawn));
	element.setAttribute("pathLength", PATH_LENGTH);
	element.style.setProperty("stroke-dasharray", `${part} 1`);
	if (part === 0) {
		element.style.setProperty("stroke-linecap", "butt");
	} else if (element.style.getPropertyValue("stroke-linecap") === "butt") {
		element.style.removeProperty("stroke-linecap");
	}
}
