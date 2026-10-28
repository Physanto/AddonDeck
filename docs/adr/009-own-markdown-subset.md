# 009. Own Markdown subset that builds the DOM

- Status: Accepted
- Date: 2026-10-27

## Context

Slide text is Markdown, rendered by the `text` block; list items and, later, table cells and timeline entries need inline Markdown too. Three things constrain the renderer:

- **Safety.** Deck text is never executed, and raw HTML must show as written. Libraries that return an HTML string need a sanitizer between them and the page.
- **Steps.** Each line that ends in a step annotation is one step, so the renderer has to say which element shows each source line, and agree with the step plan on which lines are inside code fences.
- **Size.** Everything the `text` block uses is inlined in every exported deck. Full Markdown libraries with a permissive license implement the whole of CommonMark, extensions and HTML output, and are several times larger than the subset decks need.

## Decision

The SDK has its own Markdown subset (`parseMarkdown`, `parseInline`, `renderMarkdown`, `renderInline`) that reads lines into plain data and builds DOM nodes with `createElement` and text nodes, never with `innerHTML`.

- Supported: ATX headings, paragraphs, bullet and ordered lists nested by indentation, block quotes, fenced code, horizontal rules, strong text, emphasis, inline code, links and backslash escapes.
- Raw HTML and image syntax stay literal text. Links only go to `http`, `https` and `mailto` addresses or `#` fragments.
- Every source line is a line on the slide, and the renderer maps each line to the element that shows it.
- Code fences are detected with the same functions as the step plan (`readFence` and `closesFence` from `core`).

The parser and the renderer add about 7 KB minified (2.6 KB gzip) to the `text` block, besides the step annotation helper that every block already uses.

## Consequences

- Raw HTML can't run by construction, so no sanitizer ships with the `text` block.
- Steps line up with source lines, and the `text` block and the step plan always count the same steps.
- Every block that shows text reuses the same rules, and third-party blocks get them from the SDK.
- The subset isn't full CommonMark: setext headings, indented code, lazy continuation lines, reference links, autolinks and tables aren't supported, and nested emphasis follows simpler rules. Supporting more means growing our own code, and each addition needs tests against the edge cases a library would already cover.
