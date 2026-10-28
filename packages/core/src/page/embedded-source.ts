// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// An exported page keeps the deck text inside a <script> element, which ends
// at the first `</script`, and where `<!--` followed by `<script` keeps it
// open past its closing tag. A backslash after every `<` that comes before
// `/`, `!` or `\` rules out both, and escaping `<\` as well makes the change
// reversible for any text.

const ESCAPABLE = /<([/!\\])/g;
const ESCAPED = /<\\([/!\\])/g;

/**
 * Prepares deck text to be embedded in a page's
 * `<script type="text/addondeck">`: `</` becomes `<\/`, `<!` becomes `<\!`
 * and `<\` becomes `<\\`.
 *
 * @example
 * ```ts
 * escapeEmbeddedSource("Use </script> with care"); // "Use <\/script> with care"
 * ```
 */
export function escapeEmbeddedSource(text: string): string {
	return text.replace(ESCAPABLE, "<\\$1");
}

/**
 * Reads back deck text written by {@link escapeEmbeddedSource}.
 *
 * @example
 * ```ts
 * unescapeEmbeddedSource("Use <\\/script> with care"); // "Use </script> with care"
 * ```
 */
export function unescapeEmbeddedSource(text: string): string {
	return text.replace(ESCAPED, "<$1");
}
