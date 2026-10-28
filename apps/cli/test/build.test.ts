// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXIT_CODE } from "../src/index";
import { folderWith, runCli } from "./support/test-cli";

const CLEAN = "format: 1\n\n# Hello\n";

function page(folder: string, name: string): string {
	return readFileSync(join(folder, name), "utf8");
}

describe("addondeck build", () => {
	it("writes <name>.html next to the deck by default", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		const { code, stdout, stderr } = await runCli(cwd, ["build", "talk.deck"]);
		expect(code).toBe(EXIT_CODE.ok);
		expect(stderr).toEqual([]);
		expect(stdout).toEqual([
			expect.stringMatching(/^Wrote talk\.html \(\d+\.\d KB\)\.$/),
		]);
		const html = page(cwd, "talk.html");
		expect(html).toContain('AddonDeck.register("block:text");');
		expect(html).toContain("<script>AddonDeck.start();</script>");
	});

	it("writes where -o says, creating its folder", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		const { code } = await runCli(cwd, [
			"build",
			"talk.deck",
			"-o",
			join("site", "index.html"),
		]);
		expect(code).toBe(EXIT_CODE.ok);
		expect(page(cwd, join("site", "index.html"))).toContain("<!doctype html>");
	});

	it("leaves out the watermark with --no-watermark", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		await runCli(cwd, ["build", "talk.deck", "--no-watermark"]);
		expect(page(cwd, "talk.html")).toContain(
			"<script>AddonDeck.start({ watermark: false });</script>",
		);
	});

	it("writes nothing when the deck has errors", async () => {
		const cwd = folderWith({ "talk.deck": "format: 9\n\n# Hello\n" });
		const { code, stdout, stderr } = await runCli(cwd, ["build", "talk.deck"]);
		expect(code).toBe(EXIT_CODE.deckErrors);
		expect(stdout).toEqual([]);
		expect(stderr[0]).toMatch(/^talk\.deck:1:\d+: error /);
		expect(stderr.slice(-2)).toEqual([
			"talk.deck: 1 error and 0 warnings.",
			"Nothing was written: fix the errors above, or export anyway with --force.",
		]);
		expect(existsSync(join(cwd, "talk.html"))).toBe(false);
	});

	it("writes a deck with errors when forced, and still reports them", async () => {
		const cwd = folderWith({ "talk.deck": "format: 9\n\n# Hello\n" });
		const { code, stdout } = await runCli(cwd, [
			"build",
			"talk.deck",
			"--force",
		]);
		expect(code).toBe(EXIT_CODE.deckErrors);
		expect(stdout[0]).toMatch(/despite the errors, because of --force\.$/);
		expect(existsSync(join(cwd, "talk.html"))).toBe(true);
	});

	it("fails when the artifacts cannot be found", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		const { code, stderr } = await runCli(cwd, ["build", "talk.deck"], {
			artifacts: { packages: ["@addondeck/runtime"], read: async () => null },
		});
		expect(code).toBe(EXIT_CODE.deckErrors);
		expect(stderr.some((line) => line.includes("EXPORT-E01"))).toBe(true);
	});

	it("never writes the page over the deck", async () => {
		const cwd = folderWith({ "talk.html": CLEAN });
		expect(await runCli(cwd, ["build", "talk.html"])).toEqual({
			code: EXIT_CODE.usage,
			stdout: [],
			stderr: [
				"The page would replace the deck talk.html; choose another name with -o.",
			],
		});
		expect(page(cwd, "talk.html")).toBe(CLEAN);
	});

	it("reports a page it cannot write as wrong usage", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		mkdirSync(join(cwd, "taken.html"));
		expect(
			await runCli(cwd, ["build", "talk.deck", "-o", "taken.html"]),
		).toEqual({
			code: EXIT_CODE.usage,
			stdout: [],
			stderr: ["The page cannot be written to taken.html (EISDIR)."],
		});
	});

	it("reports a missing deck as wrong usage", async () => {
		const { code, stderr } = await runCli(folderWith({}), [
			"build",
			"none.deck",
		]);
		expect(code).toBe(EXIT_CODE.usage);
		expect(stderr).toEqual(["The file none.deck does not exist."]);
	});
});
