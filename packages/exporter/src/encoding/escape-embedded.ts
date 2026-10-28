// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// The contents of <script> and <style> are raw text: the element ends at the
// first `</script` or `</style`, and inside a script `<!--` can keep it open
// past its closing tag. Each escape is one the embedded language reads as the
// original character.

/** Escapes a classic script: `</script` and `<!--` become `<\/script` and `<\x21--`. */
export function escapeScript(code: string): string {
	return code.replace(/<\/(script)/gi, "<\\/$1").replaceAll("<!--", "<\\x21--");
}

/** Escapes a style sheet: `</style` becomes `<\/style`. */
export function escapeStyle(css: string): string {
	return css.replace(/<\/(style)/gi, "<\\/$1");
}

/** Writes a value as JSON with every `<` as `<`. */
export function toEmbeddedJson(value: unknown): string {
	return JSON.stringify(value).replaceAll("<", "\\u003c");
}

/** Escapes text for an element such as `<title>`. */
export function escapeHtmlText(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

/** Escapes text for a double-quoted attribute. */
export function escapeHtmlAttribute(text: string): string {
	return escapeHtmlText(text).replaceAll('"', "&quot;");
}
