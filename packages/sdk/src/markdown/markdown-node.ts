// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepAnnotation } from "@addondeck/core";

/** A piece of inline Markdown. Narrow it with `kind`. */
export type InlineNode =
	| { readonly kind: "text"; readonly text: string }
	| { readonly kind: "strong"; readonly children: readonly InlineNode[] }
	| { readonly kind: "emphasis"; readonly children: readonly InlineNode[] }
	| { readonly kind: "code"; readonly text: string }
	| {
			readonly kind: "link";
			/** An `http`, `https` or `mailto` address, or a `#` fragment. */
			readonly href: string;
			readonly children: readonly InlineNode[];
	  };

/** One source line of a heading, paragraph or list item, without its step annotation. */
export interface MarkdownLine {
	/** Line number in the deck. */
	readonly line: number;
	readonly content: readonly InlineNode[];
}

/** An item of a Markdown list: its own lines and the lists nested in it. */
export interface MarkdownListItem {
	/** The line with the marker, then the indented lines that continue it. */
	readonly lines: readonly MarkdownLine[];
	readonly children: readonly MarkdownBlock[];
}

/** A block of Markdown. Narrow it with `kind`. */
export type MarkdownBlock =
	| {
			readonly kind: "heading";
			readonly level: 1 | 2 | 3 | 4 | 5 | 6;
			readonly line: MarkdownLine;
	  }
	| { readonly kind: "paragraph"; readonly lines: readonly MarkdownLine[] }
	| {
			readonly kind: "list";
			readonly ordered: boolean;
			/** Number of the first item of an ordered list. */
			readonly start: number;
			readonly items: readonly MarkdownListItem[];
	  }
	| { readonly kind: "quote"; readonly children: readonly MarkdownBlock[] }
	| {
			readonly kind: "code";
			/** First word after the opening fence, or an empty string. */
			readonly language: string;
			/** The lines between the fences, taken literally. */
			readonly text: string;
			/** Line of the opening fence. */
			readonly line: number;
	  }
	| { readonly kind: "rule"; readonly line: number };

/** A step annotation and the line it ends. */
export interface AnnotatedLine {
	readonly line: number;
	readonly annotation: StepAnnotation;
}

/** Markdown text read into blocks. Plain data: it can be serialized. */
export interface MarkdownDocument {
	readonly blocks: readonly MarkdownBlock[];
	/** Lines with a step annotation, in order, outside code fences. */
	readonly annotated: readonly AnnotatedLine[];
}
