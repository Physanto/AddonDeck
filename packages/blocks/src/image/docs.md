# image

An image that fills its space on the slide. Always describe it with `alt`, for people who cannot see it.

```
image src=team.jpg alt="The team at the offsite":
```

The image can also be the first argument: `image team.jpg alt="The team":`. The block has no body: everything goes in its header line.

## Where the image comes from

| Written                          | Means                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `team.jpg`                       | An uploaded image, the same as `image:team.jpg`.                                             |
| `image:team.jpg`                 | An uploaded image.                                                                           |
| `https://example.com/a.png`      | An image from the web, the same as `url:https://…`. The exporter downloads it into the file. |
| `icon:lucide/heart`, `emoji:dog` | An icon or emoji from the catalog.                                                           |

When the image cannot be found, a dashed frame with the alt text and the reference takes its place, so the slide keeps its layout.

## Options

| Option | Values             | Default   | Meaning                                                                       |
| ------ | ------------------ | --------- | ----------------------------------------------------------------------------- |
| `src`  | A reference        | —         | The image, as in the table above. Required, here or as the first argument.    |
| `alt`  | Text               | —         | What the image shows. Use `alt=""` for an image that is only decoration.      |
| `fit`  | `contain`, `cover` | `contain` | `contain` shows the whole image; `cover` fills the space and crops the edges. |

Values with spaces go in double quotes: `alt="A red train at the station"`.

```
## Our office

image office.jpg alt="Desks by a large window" fit=cover:
```

With a heading, the image fills the space below it; next to another block, it takes one column.

## Steps

The image has no steps: it is shown from the start of its slide.

## Diagnostics

| Code        | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `IMAGE-E01` | No image was given. The block is shown as text.               |
| `IMAGE-W01` | An argument or option the block does not take; it is ignored. |
| `IMAGE-W02` | An unknown value for `fit`; the whole image is shown.         |
| `IMAGE-W03` | The image has no `alt` text.                                  |
| `IMAGE-W04` | The block has body lines; they are ignored.                   |
