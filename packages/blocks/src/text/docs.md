# text

Markdown text. Every line of a slide that is not a block, a directive, notes or a comment is text, so you rarely write `text:` yourself.

```
## Why trains

They are **faster** than buses, and you can *work* on board.

- Lisbon to Coimbra: 1 h 40 min
- Coimbra to Porto: 1 h
```

## Markdown

- Headings `#` to `######`, paragraphs, bullet lists (`-`, `*`, `+`) and numbered lists (`1.` or `1)`), nested by indentation.
- `**strong**`, `*emphasis*`, `` `inline code` ``, `[links](https://example.com)`, `> block quotes`, fenced code (` ``` `) and rules (`***`).
- Each line of the source is a line on the slide: a line break inside a paragraph is kept.
- Raw HTML is shown as written, never run. Links only go to `http`, `https` and `mailto` addresses or to `#` fragments; any other link shows only its text. Images inside Markdown are not supported: use the `image` block.

## Steps

Text without step annotations is shown from the start. Each line that ends in a step annotation is one step: it stays hidden until its step, then rises into place. A heading or list item appears whole, with the lines and nested items under it; a line inside a paragraph appears alone.

```
## Three reasons

- Faster   @1
- Cheaper  @2
- Greener  @3
```

`→ id` makes another block advance in the same step:

```
- Send the request   → network
- Wait for the answer  → network
```

Lines inside fenced code are never steps.

## The explicit block

`text:` with an indented body is the same text as a block. It is useful to give a text an id, so other lines can point at it with `→ id`:

```
text id=summary:
  - First idea   @2
  - Second idea  @3
```

The block takes no arguments or options besides `id`; any other one is reported with warning `TEXT-W01` and ignored.

## Layout

A text that starts with a `#` heading is a title: it is centered vertically in its space. When a slide starts with text and has more content after it, that text becomes the slide header.

## Diagnostics

| Code       | Meaning                                        |
| ---------- | ---------------------------------------------- |
| `TEXT-W01` | An argument or option the block does not take. |

Step annotations report `W307` and `W310` like everywhere else.
