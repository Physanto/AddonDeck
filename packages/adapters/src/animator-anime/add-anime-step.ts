// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type AnimationOptions,
	type AnimationProps,
	type AnimationTarget,
	type AnimationValue,
	type DelayFunction,
	getStrokeDraw,
	type MotionTokens,
	setStrokeDraw,
	toCssValue,
} from "@addondeck/sdk";
import {
	type Timeline as AnimeTimeline,
	createMotionPath,
	type FunctionValue,
	type TweenPropValue,
} from "animejs";
import { ANIME_EASINGS } from "./anime-easings";

interface Styled extends Element {
	readonly style: CSSStyleDeclaration;
}

/** A plain object whose `draw` reads and writes the stroke of an element, so anime.js can tween it. */
interface StrokeProxy {
	draw: number;
}

function isList(targets: AnimationTarget): targets is readonly Element[] {
	return Array.isArray(targets);
}

function kebabCase(property: string): string {
	return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function toAnimeValue(key: string, value: AnimationValue): TweenPropValue {
	if (typeof value === "object") {
		return [toCssValue(key, value[0]), toCssValue(key, value[1])];
	}
	return toCssValue(key, value);
}

function toAnimeDraw(value: AnimationValue): TweenPropValue {
	return typeof value === "object"
		? [Number(value[0]), Number(value[1])]
		: Number(value);
}

function toAnimeDelay(
	delay: number | DelayFunction | undefined,
): number | FunctionValue<number> {
	if (typeof delay !== "function") return delay ?? 0;
	return (_target, index = 0, targets = []) => delay(index, targets.length);
}

/** One proxy per element, so anime.js sees a later `draw` of the same stroke as the same target and replaces the earlier one. */
const strokeProxies = new WeakMap<Element, StrokeProxy>();

function strokeProxy(element: Element): StrokeProxy {
	let proxy = strokeProxies.get(element);
	if (!proxy) {
		proxy = {
			get draw() {
				return getStrokeDraw(element);
			},
			set draw(drawn: number) {
				setStrokeDraw(element, drawn);
			},
		};
		strokeProxies.set(element, proxy);
	}
	return proxy;
}

/**
 * anime.js turns `var(--name)` into the color or length it has when the
 * animation starts. Writing the final values back as given keeps them linked
 * to the theme and leaves the same styles as the instant animator.
 */
function restoreVariables(
	elements: readonly Element[],
	props: AnimationProps,
): void {
	const literals = Object.entries(props).flatMap(([key, value]) => {
		const final = typeof value === "object" ? value[1] : value;
		return typeof final === "string" && final.includes("var(")
			? [[key.startsWith("--") ? key : kebabCase(key), final] as const]
			: [];
	});
	if (literals.length === 0) return;
	for (const element of elements) {
		if (!("style" in element)) continue;
		for (const [property, value] of literals) {
			(element as Styled).style.setProperty(property, value);
		}
	}
}

/**
 * Adds one step of `Animator.animate` or `Timeline.add` to an anime.js timeline.
 *
 * CSS properties and transform shorthands go in one anime.js animation of the
 * elements; `draw` goes in another one, of a proxy per element, that starts at
 * the same time.
 */
export function addAnimeStep(
	timeline: AnimeTimeline,
	targets: AnimationTarget,
	props: AnimationProps,
	options: AnimationOptions & { readonly at?: number },
	motion: MotionTokens,
): void {
	const elements = isList(targets) ? [...targets] : [targets];
	if (elements.length === 0) return;
	const start = options.at ?? timeline.iterationDuration;
	const timing = {
		duration: options.duration ?? motion.duration.m,
		ease: ANIME_EASINGS[options.easing ?? motion.easing.move],
		delay: toAnimeDelay(options.delay),
	};
	const { draw, ...styles } = props;
	const path = options.path;
	const tweens: Record<string, TweenPropValue> = {};
	for (const [key, value] of Object.entries(styles)) {
		const replacedByPath =
			path && (key === "x" || key === "y" || (key === "rotate" && path.rotate));
		if (!replacedByPath) tweens[key] = toAnimeValue(key, value);
	}
	if (path) {
		const motionPath = createMotionPath(path.element);
		tweens.translateX = motionPath.translateX;
		tweens.translateY = motionPath.translateY;
		if (path.rotate) tweens.rotate = motionPath.rotate;
	}
	if (Object.keys(tweens).length > 0) {
		timeline.add(
			elements,
			{
				...tweens,
				...timing,
				onComplete: () => restoreVariables(elements, styles),
			},
			start,
		);
	}
	if (draw !== undefined) {
		timeline.add(
			elements.map(strokeProxy),
			{ draw: toAnimeDraw(draw), ...timing },
			start,
		);
	}
}
