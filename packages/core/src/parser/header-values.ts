// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { normalizeKeyword } from "../text/normalize-keyword";
import { CSS_COLOR_NAMES } from "./css-color-names";

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i;
const SWITCH_VALUES: Readonly<Record<string, boolean>> = {
	on: true,
	yes: true,
	true: true,
	off: false,
	no: false,
	false: false,
};

/** Whether a value is `#rgb`, `#rrggbb` or a CSS color name. */
export function isColor(value: string): boolean {
	return HEX_COLOR.test(value) || CSS_COLOR_NAMES.has(value.toLowerCase());
}

/** Whether a value has the shape of a language tag, such as `en` or `pt-BR`. */
export function isLanguageTag(value: string): boolean {
	return LANGUAGE_TAG.test(value);
}

/** Reads `on`/`off`, `yes`/`no` or `true`/`false`; `null` for anything else. */
export function readSwitch(value: string): boolean | null {
	return SWITCH_VALUES[normalizeKeyword(value)] ?? null;
}

/** Whether a name is in an installed list, comparing normalized; always true without a list. */
export function isInstalled(
	name: string,
	installed: readonly string[] | undefined,
): boolean {
	if (installed === undefined) return true;
	const normalized = normalizeKeyword(name);
	return installed.some((item) => normalizeKeyword(item) === normalized);
}

/** Whether a value is a color or names an installed background. */
export function isBackground(
	value: string,
	installed: readonly string[] | undefined,
): boolean {
	return value !== "" && (isColor(value) || isInstalled(value, installed));
}
