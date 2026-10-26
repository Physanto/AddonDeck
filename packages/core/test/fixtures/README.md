# Parser fixtures

Decks with mistakes, used by the parser tests. They live here and not in `examples/` because examples must be valid.

Each file name starts with the diagnostic code the deck must produce, followed by a short description: `W304-unknown-block.deck` must produce at least one `W304`. The codes are described in the [format specification](../../../../docs/format/v1.md#diagnostics).

The tests parse these decks with a registry that contains two test blocks:

- `sequence`, which accepts any body;
- `explode`, which always throws while parsing, to exercise `E201`.
