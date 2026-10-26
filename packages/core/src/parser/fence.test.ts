// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { closesFence, readFence } from "./fence";

describe("code fences", () => {
	it("opens with three or more backticks or tildes", () => {
		expect(readFence("```js")).toEqual({ marker: "`", length: 3 });
		expect(readFence("   ~~~~")).toEqual({ marker: "~", length: 4 });
	});

	it("does not open with fewer markers, deep indentation or backticks in the info", () => {
		expect(readFence("``js")).toBeNull();
		expect(readFence("    ```")).toBeNull();
		expect(readFence("\t```")).toBeNull();
		expect(readFence("``` a`b")).toBeNull();
		expect(readFence("text")).toBeNull();
	});

	it("closes with the same marker, at least as long, and nothing else", () => {
		const fence = { marker: "`", length: 3 } as const;
		expect(closesFence(fence, "````")).toBe(true);
		expect(closesFence(fence, "``")).toBe(false);
		expect(closesFence(fence, "~~~")).toBe(false);
		expect(closesFence(fence, "``` js")).toBe(false);
	});
});
