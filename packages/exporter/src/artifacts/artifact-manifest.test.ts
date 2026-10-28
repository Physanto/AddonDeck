// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readArtifactManifest } from "./artifact-manifest";

function manifest(pieces: unknown, extra: object = {}): string {
	return JSON.stringify({
		manifest: 1,
		name: "@addondeck/blocks",
		version: "1.0.0",
		pieces,
		...extra,
	});
}

describe("readArtifactManifest", () => {
	it("reads the pieces of a package", () => {
		expect(
			readArtifactManifest(
				manifest([
					{ kind: "block", name: "list", script: "a.js", styles: "a.css" },
					{ kind: "theme", name: "paper", styles: "paper.css", extra: 1 },
				]),
			),
		).toEqual({
			manifest: {
				manifest: 1,
				name: "@addondeck/blocks",
				version: "1.0.0",
				pieces: [
					{ kind: "block", name: "list", script: "a.js", styles: "a.css" },
					{ kind: "theme", name: "paper", styles: "paper.css" },
				],
			},
		});
	});

	it("rejects text that is not a manifest", () => {
		expect(readArtifactManifest("{oops")).toEqual({
			error: expect.any(String),
		});
		expect(readArtifactManifest("[]")).toEqual({ error: "not a JSON object" });
		expect(readArtifactManifest(manifest([], { manifest: 2 }))).toEqual({
			error: "unsupported manifest version 2",
		});
		expect(readArtifactManifest(manifest([], { version: 1 }))).toEqual({
			error: "missing name or version",
		});
		expect(readArtifactManifest(manifest({}))).toEqual({
			error: '"pieces" is not a list',
		});
	});

	it("names the first piece that is not valid", () => {
		const invalid = [
			"text",
			{ kind: "font", name: "x", script: "a.js" },
			{ kind: "block", name: "", script: "a.js" },
			{ kind: "block", name: "x", script: 3 },
			{ kind: "block", name: "x" },
		];
		for (const piece of invalid) {
			expect(
				readArtifactManifest(
					manifest([
						{ kind: "runtime", name: "runtime", script: "r.js" },
						piece,
					]),
				),
			).toEqual({ error: "piece 2 is not valid" });
		}
	});
});
