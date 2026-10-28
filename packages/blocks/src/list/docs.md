# list

A list whose items appear one per step. Each non-blank line of the body is an item.

```
list:
  - Gather the requirements
  - Design the solution
  - Build and test it
```

- The `-`, `*` or `+` at the start of an item is optional. When the first item starts with a number, such as `1.` or `3)`, the list is numbered from that number.
- Indent an item two spaces (or one tab) per level to nest it under the previous one. In a numbered list only the top level is numbered.
- Items take inline Markdown: `**strong**`, `*emphasis*`, `` `code` `` and `[links](https://example.com)`. Raw HTML is shown as written.

A plain Markdown list in the slide text works too; the `list` block adds the steps without annotating every line, and the `reveal` option.

## Options

| Option   | Values          | Default | Meaning                                                                     |
| -------- | --------------- | ------- | --------------------------------------------------------------------------- |
| `reveal` | `each` or `all` | `each`  | `each`: one item per step. `all`: every item from the start, with no steps. |

```
list reveal=all:
  1. Plan
  2. Build
  3. Ship
```

## Steps

With `reveal=each`, the list offers one step per item, in order. Items take step annotations (`@n` and `→ id`) like any other line:

```
list id=plan:
  - Gather the requirements   @1
  - Design the solution       @3
  - Build it                  → demo
```

Nested items are steps of their own, so a sub-point can wait for its own click.

## Diagnostics

| Code       | Meaning                                                            |
| ---------- | ------------------------------------------------------------------ |
| `LIST-W01` | An argument or option the block does not take; it is ignored.      |
| `LIST-W02` | An unknown value for `reveal`; items appear one per step.          |
| `LIST-W03` | The list has no items.                                             |
| `LIST-W04` | A step annotation in a list with `reveal=all`, which has no steps. |
