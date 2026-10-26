// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readLevelOneHeading } from "./read-heading";

describe("readLevelOneHeading", () => {
	it("reads the text of a level-1 heading", () => {
		expect(readLevelOneHeading("# Hello, AddonDeck")).toBe("Hello, AddonDeck");
	});

	it("drops a closing sequence", () => {
		expect(readLevelOneHeading("# Title ##")).toBe("Title");
	});

	it("ignores other lines and empty headings", () => {
		expect(readLevelOneHeading("## Second level")).toBeNull();
		expect(readLevelOneHeading("#hashtag")).toBeNull();
		expect(readLevelOneHeading("    # code")).toBeNull();
		expect(readLevelOneHeading("#")).toBeNull();
		expect(readLevelOneHeading("# ##")).toBeNull();
		expect(readLevelOneHeading("text")).toBeNull();
	});
});
