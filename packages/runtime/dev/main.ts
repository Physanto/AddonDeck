// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Development page: shows any deck of examples/ or of a block's examples/
// with the runtime, the built-in blocks and the anime.js animator, all from
// their sources. Editing any of them reloads the page; the address keeps the
// deck (?deck=) and the position (#/slide/step).

import "../src/runtime.css";
import "./dev.css";
import type { BlockDefinition, BlockView, ResolvedAsset } from "@addondeck/sdk";
import { createAnimeAnimator } from "../../adapters/src/animator-anime/index";
import { createPluginRegistry, createRuntime } from "../src/index";

const decks = import.meta.glob<string>(
	["../../../examples/*.deck", "../../blocks/src/*/examples/*.deck"],
	{ query: "?raw", import: "default", eager: true },
);
const images = import.meta.glob<string>("../../../examples/assets/*", {
	query: "?url",
	import: "default",
	eager: true,
});
const definitions = import.meta.glob<BlockDefinition>(
	"../../blocks/src/*/definition.ts",
	{ import: "definition", eager: true },
);
const views = import.meta.glob<BlockView>("../../blocks/src/*/view.ts", {
	import: "view",
	eager: true,
});
import.meta.glob("../../blocks/src/*/styles.css", { eager: true });

/** `../../blocks/src/list/examples/steps.deck` → `list/steps`; root decks keep their name. */
function deckName(path: string): string {
	const block = /\/blocks\/src\/([^/]+)\/examples\//.exec(path)?.[1];
	const file = path.replace(/^.*\/|\.deck$/g, "");
	return block === undefined ? file : `${block}/${file}`;
}

const byName = new Map(
	Object.entries(decks).map(([path, source]) => [deckName(path), source]),
);
const names = [...byName.keys()].sort();
const requested = new URLSearchParams(location.search).get("deck");
const name = requested !== null && byName.has(requested) ? requested : names[0];

const picker = document.getElementById("deck-picker") as HTMLSelectElement;
for (const option of names) picker.add(new Option(option, option));
picker.value = name ?? "";
picker.addEventListener("change", () => {
	const url = new URL(location.href);
	url.searchParams.set("deck", picker.value);
	url.hash = "";
	location.assign(url);
});

const registry = createPluginRegistry();
registry.register({
	kind: "adapter",
	adapter: "animator",
	create: ({ motion }) => createAnimeAnimator({ motion }),
});
for (const [path, definition] of Object.entries(definitions)) {
	const view = views[path.replace(/definition\.ts$/, "view.ts")];
	if (view !== undefined)
		registry.register({ kind: "block", definition, view });
}

// Example decks refer to the files of examples/assets/ by name, as uploads.
const assets = new Map<string, ResolvedAsset>(
	Object.entries(images).map(([path, url]) => [
		`image:${path.replace(/^.*\//, "")}`,
		{ kind: "image", url },
	]),
);

const root = document.getElementById("addondeck");
if (root !== null && name !== undefined) {
	createRuntime({ root, source: byName.get(name) ?? "", registry, assets });
}
