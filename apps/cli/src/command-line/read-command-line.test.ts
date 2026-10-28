// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readCommandLine } from "./read-command-line";

function usage(args: string[]): unknown {
	const line = readCommandLine(args);
	if (line.kind !== "usage")
		throw new Error(`not a usage problem: ${line.kind}`);
	return { message: line.message, params: line.params };
}

describe("readCommandLine", () => {
	it("reads check with and without --json", () => {
		expect(readCommandLine(["check", "talk.deck"])).toEqual({
			kind: "check",
			file: "talk.deck",
			json: false,
		});
		expect(readCommandLine(["check", "--json", "talk.deck"])).toEqual({
			kind: "check",
			file: "talk.deck",
			json: true,
		});
	});

	it("reads build with its defaults", () => {
		expect(readCommandLine(["build", "talk.deck"])).toEqual({
			kind: "build",
			file: "talk.deck",
			output: null,
			watermark: true,
			force: false,
		});
	});

	it("reads every option of build, in any position", () => {
		const expected = {
			kind: "build",
			file: "talk.deck",
			output: "out/index.html",
			watermark: false,
			force: true,
		};
		expect(
			readCommandLine([
				"build",
				"--force",
				"talk.deck",
				"-o",
				"out/index.html",
				"--no-watermark",
			]),
		).toEqual(expected);
		expect(
			readCommandLine([
				"build",
				"talk.deck",
				"--output=out/index.html",
				"--no-watermark",
				"--force",
			]),
		).toEqual(expected);
	});

	it("takes a file that starts with a dash after --", () => {
		expect(readCommandLine(["check", "--", "-odd.deck"])).toMatchObject({
			kind: "check",
			file: "-odd.deck",
		});
	});

	it("asks for help with -h or --help, before any other problem", () => {
		expect(readCommandLine(["--help"])).toEqual({ kind: "help" });
		expect(readCommandLine(["build", "-h"])).toEqual({ kind: "help" });
		expect(readCommandLine(["nope", "--bad", "-h"])).toEqual({ kind: "help" });
	});

	it("asks for a command", () => {
		expect(usage([])).toEqual({ message: "missingCommand", params: {} });
	});

	it("rejects an unknown command", () => {
		expect(usage(["chek", "talk.deck"])).toEqual({
			message: "unknownCommand",
			params: { command: "chek" },
		});
	});

	it("rejects an unknown option, and an option of the other command", () => {
		expect(usage(["check", "talk.deck", "--pretty"])).toEqual({
			message: "unknownOption",
			params: { command: "check", option: "--pretty" },
		});
		expect(usage(["check", "talk.deck", "-o", "x.html"])).toEqual({
			message: "unknownOption",
			params: { command: "check", option: "-o" },
		});
		expect(usage(["build", "talk.deck", "--json"])).toEqual({
			message: "unknownOption",
			params: { command: "build", option: "--json" },
		});
	});

	it("asks for the name of the page", () => {
		for (const args of [
			["build", "talk.deck", "-o"],
			["build", "talk.deck", "-o", "--force"],
			["build", "talk.deck", "--output="],
		]) {
			expect(usage(args)).toMatchObject({ message: "missingValue" });
		}
	});

	it("rejects a value given to a switch", () => {
		expect(usage(["check", "talk.deck", "--json=yes"])).toEqual({
			message: "unexpectedValue",
			params: { option: "--json" },
		});
	});

	it("asks for exactly one deck file", () => {
		expect(usage(["build"])).toEqual({
			message: "missingFile",
			params: { command: "build" },
		});
		expect(usage(["check", "a.deck", "b.deck"])).toEqual({
			message: "extraArgument",
			params: { command: "check", argument: "b.deck" },
		});
	});

	it("remembers --json for a usage problem, so it is reported as JSON", () => {
		expect(readCommandLine(["check", "--json"])).toMatchObject({
			kind: "usage",
			command: "check",
			json: true,
		});
		expect(readCommandLine(["nope", "--json"])).toMatchObject({
			kind: "usage",
			command: null,
			json: true,
		});
	});
});
