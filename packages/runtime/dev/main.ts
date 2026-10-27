// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Development page: shows any deck of examples/ with the runtime sources.
// Every example is imported, so editing one, or the runtime, reloads the
// page; the address keeps the deck (?deck=) and the position (#/slide/step).

import "../src/runtime.css";
import "./dev.css";
import { createPluginRegistry, createRuntime } from "../src/index";

const decks = import.meta.glob<string>("../../../examples/*.deck", {
	query: "?raw",
	import: "default",
	eager: true,
});

const byName = new Map(
	Object.entries(decks).map(([path, source]) => [
		path.replace(/^.*\/|\.deck$/g, ""),
		source,
	]),
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

const root = document.getElementById("addondeck");
if (root !== null && name !== undefined) {
	createRuntime({
		root,
		source: byName.get(name) ?? "",
		registry: createPluginRegistry(),
	});
}
