---
"@addondeck/sdk": minor
"@addondeck/core": minor
---

Add `parseMarkdown`, `parseInline`, `renderMarkdown` and `renderInline`, a Markdown subset that builds the DOM without HTML strings; `setRevealed` and `playReveal` to reveal elements step by step; and `createBlockDiagnostic` for a block's own diagnostic codes. `readFence` and `closesFence` are now public, so blocks find code fences as the step plan does.
