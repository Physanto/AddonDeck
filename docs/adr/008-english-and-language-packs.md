# 008. English repository, other languages as language packs

- Status: Accepted
- Date: 2026-10-25

## Context

The project hopes for contributors from many countries, which is easier when code and documentation share one language. At the same time, many of its users don't read English, and the `.deck` format uses keywords that people and models write by hand.

## Decision

Everything in the repository is written in English: code, comments, documentation, decisions and the product's own texts. No user-visible text is written directly in the code; it comes from a text catalog, and format keywords are registered as aliases. Other languages, starting with Spanish, are added as language packs that provide translated texts, keyword aliases and block documentation.

## Consequences

- Anyone who reads English can contribute anywhere in the project.
- Adding a language doesn't require changing code, only adding a pack.
- Every new text must go through the catalog and every keyword through the alias registry, which takes some discipline from the start.
