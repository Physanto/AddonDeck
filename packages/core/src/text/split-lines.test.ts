// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { splitLines } from "./split-lines";

describe("splitLines", () => {
	it("reads every line ending as a line break", () => {
		expect(splitLines("a\r\nb\rc\nd")).toEqual(["a", "b", "c", "d"]);
	});

	it("drops a leading byte order mark", () => {
		expect(splitLines("﻿format: 1")).toEqual(["format: 1"]);
	});

	it("reads empty text as one empty line", () => {
		expect(splitLines("")).toEqual([""]);
	});
});
