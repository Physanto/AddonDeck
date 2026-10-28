// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import {
	escapeHtmlAttribute,
	escapeHtmlText,
	escapeScript,
	escapeStyle,
	toEmbeddedJson,
} from "./escape-embedded";

describe("escapeScript", () => {
	it("keeps a closing tag or a comment start in the code from ending the script", () => {
		const escaped = escapeScript(
			'const a = "</script>", b = "</SCRIPT", c = "<!--<script>";',
		);
		expect(escaped).not.toMatch(/<\/script|<!--/i);
		expect(escaped).toBe(
			'const a = "<\\/script>", b = "<\\/SCRIPT", c = "<\\x21--<script>";',
		);
	});

	it("leaves code that means the same thing", () => {
		const code =
			'globalThis.out = ["</script>", "<!--", /<\\/script>/.source, `</Script>`];';
		const run = (text: string): unknown => {
			const scope: { out?: unknown } = {};
			new Function("globalThis", text)(scope);
			return scope.out;
		};
		expect(run(escapeScript(code))).toEqual(run(code));
	});

	it("leaves other uses of < alone", () => {
		expect(escapeScript("a<b && c</d/.test(e)")).toBe("a<b && c</d/.test(e)");
	});
});

describe("escapeStyle", () => {
	it("keeps a closing tag in the styles from ending the style element", () => {
		expect(escapeStyle('a::after { content: "</style>"; }')).toBe(
			'a::after { content: "<\\/style>"; }',
		);
		expect(escapeStyle("a { b: c } /* </STYLE */")).toBe(
			"a { b: c } /* <\\/STYLE */",
		);
	});
});

describe("toEmbeddedJson", () => {
	it("writes no < at all and reads back the same value", () => {
		const value = { "image:</script>": { url: "data:,<!--" } };
		const json = toEmbeddedJson(value);
		expect(json).not.toContain("<");
		expect(JSON.parse(json)).toEqual(value);
	});
});

describe("HTML escapes", () => {
	it("escapes text and attributes", () => {
		expect(escapeHtmlText('a & <b> "c"')).toBe('a &amp; &lt;b&gt; "c"');
		expect(escapeHtmlAttribute('a & <b> "c"')).toBe(
			"a &amp; &lt;b&gt; &quot;c&quot;",
		);
	});
});
