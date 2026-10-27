// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Animation } from "./animation";
import type {
	AnimationProps,
	AnimationTarget,
	AnimationValue,
} from "./animation-props";
import type { Animator } from "./animator";
import type { Timeline } from "./timeline";

type TransformKey = "x" | "y" | "scale" | "rotate";

const TRANSFORM_KEYS: ReadonlySet<string> = new Set<TransformKey>([
	"x",
	"y",
	"scale",
	"rotate",
]);

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
]);

type Transform = Partial<Record<TransformKey, string>>;

interface Styled extends Element {
	readonly style: CSSStyleDeclaration;
}

function isStyled(element: Element): element is Styled {
	return "style" in element;
}

function kebabCase(property: string): string {
	return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function withUnit(key: string, value: number | string): string {
	if (typeof value === "string") return value;
	if (key === "rotate") return `${value}deg`;
	if (UNITLESS.has(key) || key.startsWith("--")) return String(value);
	return `${value}px`;
}

function composeTransform(transform: Transform): string {
	const parts: string[] = [];
	if (transform.x !== undefined || transform.y !== undefined) {
		parts.push(`translate(${transform.x ?? "0px"}, ${transform.y ?? "0px"})`);
	}
	if (transform.scale !== undefined) parts.push(`scale(${transform.scale})`);
	if (transform.rotate !== undefined) parts.push(`rotate(${transform.rotate})`);
	return parts.join(" ");
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

function settled(): Animation {
	return {
		duration: 0,
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
 * same styles an animated adapter leaves at the end, so it serves to jump to a
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
	const transforms = new WeakMap<Element, Transform>();

	const apply = (targets: AnimationTarget, props: AnimationProps): void => {
		for (const element of targetsOf(targets)) {
			if (!isStyled(element)) continue;
			const transform = { ...transforms.get(element) };
			let transformed = false;
			for (const [key, value] of Object.entries(props)) {
				const final = withUnit(key, finalValue(value));
				if (TRANSFORM_KEYS.has(key)) {
					transform[key as TransformKey] = final;
					transformed = true;
				} else {
					element.style.setProperty(
						key.startsWith("--") ? key : kebabCase(key),
						final,
					);
				}
			}
			if (transformed) {
				transforms.set(element, transform);
				element.style.transform = composeTransform(transform);
			}
		}
	};

	return {
		animate(targets, props) {
			apply(targets, props);
			return settled();
		},
		timeline() {
			const timeline: Timeline = {
				...settled(),
				add(targets, props) {
					apply(targets, props);
					return timeline;
				},
			};
			return timeline;
		},
	};
}
