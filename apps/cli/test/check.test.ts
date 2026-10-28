// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXIT_CODE } from "../src/index";
import { folderWith, runCli } from "./support/test-cli";

const CLEAN = "format: 1\n\n# Hello\n";
const WARNED = "format: 1\nmotion: wobbly\n\n# Hello\n";
const BROKEN = 'format: 9\n\n# Hello\n\nimage gone.png alt="":\n';

describe("addondeck check", () => {
	it("reports a deck without problems", async () => {
		const cwd = folderWith({ "talk.deck": CLEAN });
		expect(await runCli(cwd, ["check", "talk.deck"])).toEqual({
			code: EXIT_CODE.ok,
			stdout: ["talk.deck: no problems found."],
			stderr: [],
		});
	});

	it("lists warnings with their position, and still succeeds", async () => {
		const cwd = folderWith({ "talk.deck": WARNED });
		const { code, stdout } = await runCli(cwd, ["check", "talk.deck"]);
		expect(code).toBe(EXIT_CODE.ok);
		expect(stdout[0]).toMatch(/^talk\.deck:2:\d+: warning W303: /);
		expect(stdout.at(-1)).toBe("talk.deck: 0 errors and 1 warning.");
	});

	it("fails on errors, and reports the problems of the export with them", async () => {
		const cwd = folderWith({ "talk.deck": BROKEN });
		const { code, stdout } = await runCli(cwd, ["check", "talk.deck"]);
		expect(code).toBe(EXIT_CODE.deckErrors);
		expect(stdout.some((line) => / error E\d+: /.test(line))).toBe(true);
		expect(stdout).toContain(
			'talk.deck:5:1: warning EXPORT-W01: The asset "image:gone.png" was not found; the exported deck shows a frame in its place.',
		);
		expect(stdout.at(-1)).toBe("talk.deck: 1 error and 1 warning.");
	});

	it("prints the documented JSON with --json", async () => {
		const cwd = folderWith({ "talk.deck": BROKEN });
		const { code, stdout } = await runCli(cwd, [
			"check",
			"talk.deck",
			"--json",
		]);
		expect(code).toBe(EXIT_CODE.deckErrors);
		expect(stdout).toHaveLength(1);
		const report = JSON.parse(stdout[0] ?? "");
		expect(Object.keys(report)).toEqual([
			"schema",
			"command",
			"file",
			"ok",
			"summary",
			"diagnostics",
		]);
		expect(report).toMatchObject({
			schema: 1,
			command: "check",
			file: "talk.deck",
			ok: false,
			summary: { errors: 1, warnings: 1, info: 0 },
		});
		expect(report.diagnostics[1]).toEqual({
			severity: "warning",
			code: "EXPORT-W01",
			line: 5,
			column: 1,
			message:
				'The asset "image:gone.png" was not found; the exported deck shows a frame in its place.',
			params: { reference: "image:gone.png" },
		});
	});

	it("includes the suggestion of a problem in the JSON", async () => {
		const cwd = folderWith({ "talk.deck": "format: 1\n\nlsit:\n  - a\n" });
		const { stdout } = await runCli(cwd, ["check", "talk.deck", "--json"]);
		const report = JSON.parse(stdout[0] ?? "");
		expect(report.ok).toBe(true);
		expect(report.diagnostics[0]).toMatchObject({
			code: "W304",
			suggestion: "list",
		});
	});

	it("reports a file it cannot read as wrong usage, in JSON when asked", async () => {
		const cwd = folderWith({});
		mkdirSync(join(cwd, "folder.deck"));
		expect(await runCli(cwd, ["check", "none.deck"])).toEqual({
			code: EXIT_CODE.usage,
			stdout: [],
			stderr: ["The file none.deck does not exist."],
		});
		const { code, stdout } = await runCli(cwd, [
			"check",
			"folder.deck",
			"--json",
		]);
		expect(code).toBe(EXIT_CODE.usage);
		expect(JSON.parse(stdout[0] ?? "")).toEqual({
			schema: 1,
			command: "check",
			ok: false,
			usage: "The file folder.deck cannot be read (EISDIR).",
		});
	});

	it("reads a deck from another folder, with its images", async () => {
		const cwd = folderWith({});
		mkdirSync(join(cwd, "talks", "assets"), { recursive: true });
		writeFileSync(
			join(cwd, "talks", "talk.deck"),
			'format: 1\n\nimage team.png alt="":\n',
		);
		writeFileSync(join(cwd, "talks", "assets", "team.png"), Uint8Array.of(1));
		const file = join("talks", "talk.deck");
		expect(await runCli(cwd, ["check", file])).toEqual({
			code: EXIT_CODE.ok,
			stdout: [`${file}: no problems found.`],
			stderr: [],
		});
	});
});
