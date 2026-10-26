# 004. The `.deck` text is the only API, with no server

- Status: Accepted
- Date: 2026-10-25

## Context

People reach AddonDeck in three ways: filling forms in the Studio, asking a language model in a chat or an agent, and writing plugins as developers. Supporting a different interface for each would multiply the code to maintain and test. The project also has no budget to run servers.

## Decision

Every path produces `.deck` text, and the engine only understands that text. Forms generate it, models write it and developers write it. There is no hosted service: parsing, preview and export run in the user's browser or terminal.

## Consequences

- There is a single path from input to presentation to maintain and test.
- Any model can drive AddonDeck, since it only needs to write text; the format is kept short and tolerant of mistakes.
- The format becomes a public contract: it is versioned and changes need migrations.
- There are no server features such as accounts or hosted sharing; users share files.
