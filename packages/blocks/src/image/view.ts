// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockView } from "@addondeck/sdk";
import type { ImageModel } from "./definition";

/**
 * Draws the image resolved from its reference. When nothing resolves it,
 * a frame takes its place with the alt text and the reference, so the slide
 * keeps its layout and the author sees what is missing.
 */
export const view: BlockView<ImageModel> = {
	type: "image",
	mount(model, el, ctx) {
		const document = el.ownerDocument;
		const figure = document.createElement("figure");
		figure.className = "adk-image";
		figure.dataset.fit = model.fit;
		const alt = model.alt ?? "";

		const asset = ctx.assets.resolve(model.reference);
		if (asset === null) {
			figure.dataset.missing = "";
			const frame = document.createElement("div");
			frame.className = "adk-image-missing";
			frame.setAttribute("role", "img");
			frame.setAttribute("aria-label", alt);
			const reference = document.createElement("code");
			reference.textContent = model.reference;
			frame.append(alt, reference);
			figure.append(frame);
		} else {
			const image = document.createElement("img");
			image.src = asset.url;
			image.alt = alt;
			image.decoding = "async";
			image.draggable = false;
			figure.append(image);
		}
		el.append(figure);

		return {
			setState() {},
			play: async () => {},
			destroy() {
				figure.remove();
			},
		};
	},
};
