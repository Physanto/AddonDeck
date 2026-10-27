// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Transform shorthands of `AnimationProps`. */
export type TransformKey = "x" | "y" | "scale" | "rotate";

export const TRANSFORM_KEYS: ReadonlySet<string> = new Set<TransformKey>([
	"x",
	"y",
	"scale",
	"rotate",
]);

/** The shorthands of a `transform` and the functions it has besides them, as written. */
export interface InlineTransform {
	readonly values: Partial<Record<TransformKey, string>>;
	readonly others: readonly string[];
}

interface TransformFunction {
	readonly name: string;
	readonly args: readonly string[];
	readonly text: string;
}

/** Splits `a(b, c(d)) e(f)` into functions, keeping nested parentheses such as `calc()` or `var()`. */
function splitFunctions(transform: string): readonly TransformFunction[] {
	const functions: TransformFunction[] = [];
	let start = 0;
	let open = -1;
	let depth = 0;
	const args: string[] = [];
	let argStart = 0;
	for (let index = 0; index < transform.length; index++) {
		const char = transform[index];
		if (char === "(") {
			if (depth === 0) {
				open = index;
				argStart = index + 1;
			}
			depth++;
		} else if (char === "," && depth === 1) {
			args.push(transform.slice(argStart, index).trim());
			argStart = index + 1;
		} else if (char === ")" && depth > 0) {
			depth--;
			if (depth === 0) {
				args.push(transform.slice(argStart, index).trim());
				functions.push({
					name: transform.slice(start, open).trim(),
					args: [...args],
					text: transform.slice(start, index + 1).trim(),
				});
				args.length = 0;
				start = index + 1;
			}
		}
	}
	return functions;
}

/**
 * Reads the shorthands of an inline `transform`, whether one animator wrote
 * `translate(x, y)` or another `translateX(x) translateY(y)`.
 */
export function readTransform(transform: string): InlineTransform {
	const values: Partial<Record<TransformKey, string>> = {};
	const others: string[] = [];
	for (const { name, args, text } of splitFunctions(transform)) {
		const [first, second] = args;
		if (name === "translate" && first !== undefined) {
			values.x = first;
			values.y = second ?? "0px";
		} else if (name === "translateX" && first !== undefined) {
			values.x = first;
		} else if (name === "translateY" && first !== undefined) {
			values.y = first;
		} else if (name === "rotate" && first !== undefined) {
			values.rotate = first;
		} else if (
			name === "scale" &&
			first !== undefined &&
			second === undefined
		) {
			values.scale = first;
		} else {
			others.push(text);
		}
	}
	return { values, others };
}

/**
 * Writes the shorthands in the order of the CSS `translate`, `rotate` and
 * `scale` properties, which is also the order animation libraries use, and
 * then the other functions.
 */
export function writeTransform({ values, others }: InlineTransform): string {
	const parts: string[] = [];
	if (values.x !== undefined || values.y !== undefined) {
		parts.push(`translate(${values.x ?? "0px"}, ${values.y ?? "0px"})`);
	}
	if (values.rotate !== undefined) parts.push(`rotate(${values.rotate})`);
	if (values.scale !== undefined) parts.push(`scale(${values.scale})`);
	return [...parts, ...others].join(" ");
}
