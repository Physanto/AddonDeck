// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

// The example deck in a page laid out as an exported file, driven through the
// page global as a presenter would: with the keyboard and the address hash.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { register, start } from "../src/browser";
import type { Runtime } from "../src/start/create-runtime";
import { type BoxLog, createBoxPlugin } from "./support/box-plugin";

// The test DOM replaces the global URL, so the path is built without it.
const SOURCE = readFileSync(
	join(import.meta.dirname, "../../../examples/hello.deck"),
	"utf8",
);

let runtime: Runtime | null;
const log: BoxLog = [];

function press(key: string): void {
	document.body.dispatchEvent(
		new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
	);
}

function currentSlide(): HTMLElement | null {
	return document.querySelector('.adk-slide[data-state="current"]');
}

beforeAll(() => {
	document.body.innerHTML = `
		<div id="addondeck"></div>
		<script type="text/addondeck" id="addondeck-source"></script>
		<script type="application/json" id="addondeck-assets">{}</script>`;
	const source = document.getElementById("addondeck-source");
	if (source !== null) source.textContent = SOURCE;
	// Plugin scripts run before the call to start, as the exporter orders them.
	register(createBoxPlugin(log));
	// Opened from a link to the second slide.
	location.hash = "#/2";
	runtime = start();
});

describe("hello.deck in an exported page", () => {
	it("starts once, with the plugins registered before", () => {
		expect(runtime).not.toBeNull();
		expect(start()).toBe(runtime);
		expect(runtime?.diagnostics).toEqual([]);
		expect(() => register(createBoxPlugin())).toThrow(
			"The box block is already registered.",
		);
	});

	it("opens the slide in the address hash", () => {
		expect(currentSlide()?.dataset.index).toBe("1");
		expect(currentSlide()?.textContent).toContain("How it works");
	});

	it("is navigated from start to end and back with the keyboard", () => {
		press("Home");
		expect(currentSlide()?.dataset.index).toBe("0");
		expect(currentSlide()?.textContent).toContain("Hello, AddonDeck");
		expect(location.hash).toBe("#/1");

		press("ArrowRight");
		expect(currentSlide()?.dataset.index).toBe("1");
		expect(location.hash).toBe("#/2");
		press(" ");
		press("PageDown");
		press("Enter");
		expect(currentSlide()?.dataset.index).toBe("1");

		press("ArrowLeft");
		expect(currentSlide()?.dataset.index).toBe("0");
		press("End");
		expect(currentSlide()?.dataset.index).toBe("1");
		press("PageUp");
		press("Backspace");
		expect(currentSlide()?.dataset.index).toBe("0");
		expect(location.hash).toBe("#/1");
	});

	it("keeps both slides mounted, since each is the other's neighbor", () => {
		expect(document.querySelectorAll(".adk-slide")).toHaveLength(2);
	});
});
