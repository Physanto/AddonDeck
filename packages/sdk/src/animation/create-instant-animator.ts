// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Animation } from "./animation";
import type { AnimationOptions } from "./animation-options";
import type {
	AnimationProps,
	AnimationTarget,
	AnimationValue,
} from "./animation-props";
import type { Animator } from "./animator";
import {
	readTransform,
	TRANSFORM_KEYS,
	type TransformKey,
	writeTransform,
} from "./inline-transform";
import { pathEnd } from "./path-end";
import { setStrokeDraw } from "./stroke-draw";
import type { Timeline } from "./timeline";
import { toCssValue } from "./to-css-value";

interface Styled extends Element {
	readonly style: CSSStyleDeclaration;
}

function isStyled(element: Element): element is Styled {
	return "style" in element;
}

function kebabCase(property: string): string {
	return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function finalValue(value: AnimationValue): number | string {
	return typeof value === "object" ? value[1] : value;
}

function isList(targets: AnimationTarget): targets is readonly Element[] {
	return Array.isArray(targets);
}

function targetsOf(targets: AnimationTarget): readonly Element[] {
	return isList(targets) ? targets : [targets];
}

/** The final transform values of each shorthand, with the path in place of `x`, `y` and maybe `rotate`. */
function finalTransform(
	element: Element,
	props: AnimationProps,
	options: AnimationOptions | undefined,
): Partial<Record<TransformKey, string>> {
	const values: Partial<Record<TransformKey, string>> = {};
	for (const [key, value] of Object.entries(props)) {
		if (TRANSFORM_KEYS.has(key)) {
			values[key as TransformKey] = toCssValue(key, finalValue(value));
		}
	}
	const path = options?.path;
	if (path) {
		const end = pathEnd(path.element, element);
		values.x = toCssValue("x", end.x);
		values.y = toCssValue("y", end.y);
		if (path.rotate) values.rotate = toCssValue("rotate", end.angle);
	}
	return values;
}

function apply(
	targets: AnimationTarget,
	props: AnimationProps,
	options: AnimationOptions | undefined,
): void {
	for (const element of targetsOf(targets)) {
		if (!isStyled(element)) continue;
		for (const [key, value] of Object.entries(props)) {
			if (TRANSFORM_KEYS.has(key)) continue;
			if (key === "draw") {
				setStrokeDraw(element, Number(finalValue(value)));
				continue;
			}
			element.style.setProperty(
				key.startsWith("--") ? key : kebabCase(key),
				toCssValue(key, finalValue(value)),
			);
		}
		const values = finalTransform(element, props, options);
		if (Object.keys(values).length > 0) {
			const current = readTransform(element.style.transform);
			element.style.transform = writeTransform({
				values: { ...current.values, ...values },
				others: current.others,
			});
		}
	}
}

function settled(): Animation {
	return {
		duration: 0,
		progress: 1,
		finished: Promise.resolve(),
		play: () => {},
		pause: () => {},
		seek: () => {},
		finish: () => {},
		cancel: () => {},
	};
}

/**
 * Creates an animator that applies the final values at once, without any library.
 *
 * Every animation is already finished when it is returned. It produces the
 * same styles an animated adapter leaves at the end, and it reads the
 * `transform` already written instead of remembering its own, so it can take
 * turns with an animated adapter on the same elements. It serves to jump to a
 * step, to show decks with reduced motion and to run block tests.
 *
 * @returns An animator whose animations take no time.
 *
 * @example
 * ```ts
 * const animator = createInstantAnimator();
 * animator.animate(element, { opacity: [0, 1], x: 40 });
 * element.style.opacity; // "1"
 * element.style.transform; // "translate(40px, 0px)"
 * ```
 */
export function createInstantAnimator(): Animator {
	return {
		animate(targets, props, options) {
			apply(targets, props, options);
			return settled();
		},
		timeline() {
			const timeline: Timeline = {
				...settled(),
				add(targets, props, options) {
					apply(targets, props, options);
					return timeline;
				},
			};
			return timeline;
		},
	};
}
