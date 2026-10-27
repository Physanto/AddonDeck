// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Easing } from "@addondeck/sdk";
import type { EaseStringParamNames } from "animejs";

/**
 * The anime.js name of each project easing; the only place where they are
 * translated, so a missing curve is a type error here.
 */
export const ANIME_EASINGS: Readonly<Record<Easing, EaseStringParamNames>> = {
	linear: "linear",
	inQuad: "inQuad",
	outQuad: "outQuad",
	inOutQuad: "inOutQuad",
	inCubic: "inCubic",
	outCubic: "outCubic",
	inOutCubic: "inOutCubic",
	inBack: "inBack",
	outBack: "outBack",
	inOutBack: "inOutBack",
	outElastic: "outElastic",
	outBounce: "outBounce",
};
