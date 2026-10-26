# @addondeck/core

Parser, document model, validator and diagnostics for the .deck format.

Turns `.deck` text into a `Deck` document plus diagnostics. It has no DOM access and knows no concrete block; other packages build on it.

It defines:

- the document model (`Deck`, `Slide`, `TextNode`, `BlockNode`…), plain immutable data;
- the pure block contracts (`BlockDefinition`, `BlockSource`, `ParseResult`, `StepDef`), which `@addondeck/sdk` re-exports for block authors;
- diagnostics with stable codes and a translatable message catalog (`createDiagnostic`).

The format itself is specified in [docs/format/v1.md](../../docs/format/v1.md).

> Status: the model and the contracts are in place; the parser is in progress. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
