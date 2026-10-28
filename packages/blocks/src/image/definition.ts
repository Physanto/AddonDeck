// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockDefinition,
	createBlockDiagnostic,
	type Diagnostic,
} from "@addondeck/sdk";
import { IMAGE_MESSAGES } from "./messages";

/** How the image fills its space: whole (`contain`) or cropped to fill it (`cover`). */
export type ImageFit = "contain" | "cover";

/** What the image block draws. */
export interface ImageModel {
	/** Asset reference for the asset resolver, such as `image:team.jpg`. */
	readonly reference: string;
	/** Text alternative; empty for a decorative image, `null` when missing. */
	readonly alt: string | null;
	readonly fit: ImageFit;
}

const FITS: readonly string[] = ["contain", "cover"] satisfies ImageFit[];
const PREFIXED = /^(?:image|url|icon|emoji):/i;
const WEB = /^https?:\/\//i;

/**
 * The asset reference of an image as written in the deck: `team.jpg` is an
 * uploaded image (`image:team.jpg`), a web address is `url:…`, and a
 * reference with a known prefix is kept.
 */
export function toImageReference(written: string): string {
	if (PREFIXED.test(written)) return written;
	if (WEB.test(written)) return `url:${written}`;
	return `image:${written}`;
}

/**
 * An image that fills its space. It has no steps.
 */
export const definition: BlockDefinition<ImageModel> = {
	type: "image",
	aliases: [],
	version: "1.0.0",
	parse(source) {
		const diagnostics: Diagnostic[] = [];
		const ignore = (name: string, location = source.location): void => {
			diagnostics.push(
				createBlockDiagnostic(IMAGE_MESSAGES, "IMAGE-W01", location, { name }),
			);
		};

		let src: string | null = null;
		let alt: string | null = null;
		let fit: ImageFit = "contain";
		for (const option of source.options) {
			if (option.key === "src") {
				src = option.value;
			} else if (option.key === "alt") {
				alt = option.value;
			} else if (option.key !== "fit") {
				ignore(option.name, option.location);
			} else if (FITS.includes(option.value.toLowerCase())) {
				fit = option.value.toLowerCase() as ImageFit;
			} else {
				diagnostics.push(
					createBlockDiagnostic(IMAGE_MESSAGES, "IMAGE-W02", option.location, {
						value: option.value,
					}),
				);
			}
		}
		const [first, ...rest] = source.args;
		if (src === null && first !== undefined) src = first;
		else if (first !== undefined) ignore(first);
		for (const name of rest) ignore(name);

		const body = source.body.find((line) => line.text.trim() !== "");
		if (body !== undefined) {
			diagnostics.push(
				createBlockDiagnostic(IMAGE_MESSAGES, "IMAGE-W04", {
					line: body.line,
					column: 1,
				}),
			);
		}

		if (src === null || src.trim() === "") {
			diagnostics.unshift(
				createBlockDiagnostic(IMAGE_MESSAGES, "IMAGE-E01", source.location),
			);
			return { model: null, diagnostics };
		}
		if (alt === null) {
			diagnostics.push(
				createBlockDiagnostic(IMAGE_MESSAGES, "IMAGE-W03", source.location),
			);
		}
		return {
			model: { reference: toImageReference(src.trim()), alt, fit },
			diagnostics,
		};
	},
	steps: () => [],
	assets: (model) => [model.reference],
};
