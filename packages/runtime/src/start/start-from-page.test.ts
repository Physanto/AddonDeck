// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import type { RuntimeIssue } from "../issues/runtime-issue";
import { createPluginRegistry } from "../registry/create-plugin-registry";
import type { Runtime } from "./create-runtime";
import { startFromPage } from "./start-from-page";

let runtime: Runtime | null = null;

afterEach(() => {
	runtime?.destroy();
	runtime = null;
	document.body.replaceChildren();
	location.hash = "";
});

function page(parts: {
	root?: boolean;
	source?: string;
	assets?: string;
}): void {
	if (parts.root !== false) {
		const root = document.createElement("div");
		root.id = "addondeck";
		document.body.append(root);
	}
	if (parts.source !== undefined) {
		const script = document.createElement("script");
		script.type = "text/addondeck";
		script.id = "addondeck-source";
		script.textContent = parts.source;
		document.body.append(script);
	}
	if (parts.assets !== undefined) {
		const script = document.createElement("script");
		script.type = "application/json";
		script.id = "addondeck-assets";
		script.textContent = parts.assets;
		document.body.append(script);
	}
}

function startPage(): RuntimeIssue[] {
	const issues: RuntimeIssue[] = [];
	runtime = startFromPage(document, {
		registry: createPluginRegistry(),
		report: (issue) => issues.push(issue),
	});
	return issues;
}

describe("startFromPage", () => {
	it("shows the deck embedded in the page", () => {
		page({ source: "# One\n\n---\n\n# Two" });
		expect(startPage()).toEqual([]);
		expect(runtime?.deck.slides).toHaveLength(2);
		expect(
			document.querySelector("#addondeck .adk-slide[data-state=current]"),
		).not.toBeNull();
	});

	it("reads back the escaped deck text", () => {
		page({ source: "# One <\\/script> <\\!-- x" });
		startPage();
		expect(runtime?.deck.meta.title).toBe("One </script> <!-- x");
	});

	it("reports a page without a root", () => {
		page({ root: false, source: "# One" });
		expect(startPage()).toEqual([
			{
				severity: "error",
				message:
					'No element with the id "addondeck" was found, so the deck cannot be shown.',
			},
		]);
		expect(runtime).toBeNull();
	});

	it("reports a page without deck text", () => {
		page({});
		expect(startPage()).toEqual([
			{
				severity: "error",
				message:
					'No deck text was found: the page needs a <script type="text/addondeck" id="addondeck-source"> element.',
			},
		]);
		expect(runtime).toBeNull();
	});

	it("shows the deck without assets when they cannot be read", () => {
		page({ source: "# One", assets: "{not json" });
		const issues = startPage();
		expect(issues).toEqual([
			{
				severity: "warning",
				message: expect.stringMatching(
					/^The embedded assets could not be read \(.+\); the deck is shown without them\.$/,
				),
			},
		]);
		expect(runtime?.deck.slides).toHaveLength(1);
	});

	it("reports each invalid asset and keeps the others", () => {
		page({
			source: "# One",
			assets: JSON.stringify({
				assets: {
					"image:a.png": { kind: "image", url: "data:," },
					"image:b.png": { kind: "image" },
				},
			}),
		});
		expect(startPage()).toEqual([
			{
				severity: "warning",
				message:
					'The embedded asset "image:b.png" is not valid and is ignored.',
			},
		]);
	});

	it("uses the messages of the active language, with English for the missing ones", () => {
		const issues: RuntimeIssue[] = [];
		const options = {
			registry: createPluginRegistry(),
			messages: { missingSource: 'Falta "{id}".' },
			report: (issue: RuntimeIssue) => issues.push(issue),
		};
		startFromPage(document, options);
		page({});
		startFromPage(document, options);
		expect(issues.map((issue) => issue.message)).toEqual([
			'No element with the id "addondeck" was found, so the deck cannot be shown.',
			'Falta "addondeck-source".',
		]);
	});

	it("shows only errors on the slides, since the audience sees the page", () => {
		page({ source: "watermark: maybe\n\n# One" });
		startPage();
		expect(document.querySelector(".adk-error-card")).toBeNull();
		runtime?.destroy();
		document.body.replaceChildren();
		page({ source: "format: 9\n\n# One" });
		startPage();
		expect(
			document
				.querySelector(".adk-error-card li")
				?.getAttribute("data-severity"),
		).toBe("error");
	});
});
