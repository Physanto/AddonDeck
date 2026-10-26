# @addondeck/core

Parser, document model, validator and diagnostics for the .deck format.

Turns `.deck` text into a `Deck` document plus diagnostics. It has no DOM access and knows no concrete block; other packages build on it.

It defines:

- `parse`, a tolerant parser: it never throws, and every problem becomes a diagnostic with a stable code;
- the block registry (`createBlockRegistry`), which tells the parser which blocks are installed and accepts language packs with extra aliases;
- the document model (`Deck`, `Slide`, `TextNode`, `BlockNode`…), plain immutable data;
- the pure block contracts (`BlockDefinition`, `BlockSource`, `ParseResult`, `StepDef`), which `@addondeck/sdk` re-exports for block authors;
- helpers that blocks reuse: `extractStepAnnotations` for `@n` and `→ id`, `normalizeKeyword` and `closestKeyword`;
- diagnostics with stable codes and a translatable message catalog (`createDiagnostic`).

```ts
import { createBlockRegistry, parse } from "@addondeck/core";

const registry = createBlockRegistry([sequence]);
const { deck, diagnostics } = parse(text, { registry });
```

The format itself is specified in [docs/format/v1.md](../../docs/format/v1.md).

Tests that read the fixtures in `test/fixtures/` and the decks in [`examples/`](../../examples/) live in `test/`, which has Node.js types; `src/` does not, because the package also runs in the browser.

> Status: the parser, the model and the contracts are in place; the step plan arrives with the SDK. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
