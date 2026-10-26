# 005. A single HTML file as the default output

- Status: Accepted
- Date: 2026-10-25

## Context

Presentations are shared by email, chat and USB drives, and opened by people who don't install anything. A zip with an HTML file and an assets folder breaks when opened without extracting it, which is what Windows does by default when you double-click a zip: the page loads but its relative paths fail.

## Decision

The exporter produces one self-contained `index.html` by default: scripts, styles, fonts and images are inlined, with binary assets encoded as data. A zip is offered only as an option, for decks with heavy videos.

## Consequences

- One file to send and to open, with nothing to extract.
- Files are larger than the sum of their parts, so the exporter must include only what each deck uses and the project keeps a size budget.
- Very large media is a poor fit for the default output, hence the zip option.
