// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import {
	type BlockContext,
	type BlockPlugin,
	createInstantAnimator,
	type Plugin,
} from "@addondeck/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type BoxLog,
	type BoxModel,
	createBoxPlugin,
} from "../../test/support/box-plugin";
import type { RuntimeIssue } from "../issues/runtime-issue";
import { createPluginRegistry } from "../registry/create-plugin-registry";
import {
	DEFAULT_MOTION_TOKENS,
	DEFAULT_THEME_TOKENS,
} from "../theme/default-tokens";
import {
	createRuntime,
	type Runtime,
	type RuntimeOptions,
} from "./create-runtime";

let runtime: Runtime | null = null;

beforeEach(() => {
	location.hash = "";
});

afterEach(() => {
	runtime?.destroy();
	runtime = null;
	document.body.replaceChildren();
});

function start(
	source: string,
	plugins: readonly Plugin[] = [],
	extra: Partial<Omit<RuntimeOptions, "root" | "source" | "registry">> = {},
) {
	const registry = createPluginRegistry();
	for (const plugin of plugins) registry.register(plugin);
	const root = document.createElement("div");
	document.body.append(root);
	const issues: RuntimeIssue[] = [];
	runtime = createRuntime({
		root,
		source,
		registry,
		report: (issue) => issues.push(issue),
		...extra,
	});
	const current = (): string | undefined =>
		root.querySelector<HTMLElement>('.adk-slide[data-state="current"]')?.dataset
			.index;
	return { runtime, root, issues, current };
}

function press(key: string): void {
	document.body.dispatchEvent(
		new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
	);
}

/** A box that remembers the context it was mounted with. */
function contextSpy(contexts: BlockContext[]): BlockPlugin<BoxModel> {
	const box = createBoxPlugin();
	return {
		...box,
		view: {
			type: "box",
			mount(model, el, ctx) {
				contexts.push(ctx);
				return box.view.mount(model, el, ctx);
			},
		},
	};
}

describe("createRuntime", () => {
	it("draws the first slide on a stage inside the root", () => {
		const { root, current, runtime } = start("# One\n\n---\n\n# Two");
		expect(runtime.deck.slides).toHaveLength(2);
		expect(root.querySelector(".adk-viewport > .adk-stage")).not.toBeNull();
		expect(current()).toBe("0");
		expect(location.hash).toBe("#/1");
	});

	it("labels each slide with its number", () => {
		const { root } = start("# One\n\n---\n\n# Two");
		expect(
			root
				.querySelector(".adk-slide[data-index='1']")
				?.getAttribute("aria-label"),
		).toBe("Slide 2 of 2");
	});

	it("counts the clicks of each slide from its step plan", () => {
		const { runtime } = start("box:\n  a\n  b\n\n---\n\n# Two", [
			createBoxPlugin(),
		]);
		runtime.navigator.next();
		runtime.navigator.next();
		expect(runtime.navigator.position).toEqual({ slide: 0, step: 2 });
		runtime.navigator.next();
		expect(runtime.navigator.position).toEqual({ slide: 1, step: 0 });
	});

	it("moves between slides with the keyboard and clicks", () => {
		const { root, current } = start("# One\n\n---\n\n# Two\n\n---\n\n# Three");
		press("ArrowRight");
		expect(current()).toBe("1");
		root
			.querySelector(".adk-viewport")
			?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(current()).toBe("2");
		expect(location.hash).toBe("#/3");
		press("Home");
		expect(current()).toBe("0");
	});

	it("opens the slide in the address hash", () => {
		location.hash = "#/2";
		const { current, runtime } = start(
			"# One\n\n---\n\n# Two\n\n---\n\n# Three",
		);
		expect(current()).toBe("1");
		expect(runtime.navigator.position).toEqual({ slide: 1, step: 0 });
	});

	it("reports an unknown block as a block whose script is missing", () => {
		const { issues } = start("sequence id=payment:\n  A -> B: hi");
		expect(issues).toEqual([
			{
				severity: "error",
				message:
					'Line 1: the block "sequence" is not registered, so it is shown as text. Load its script before AddonDeck.start().',
			},
		]);
	});

	it("reports other parser diagnostics with their position, and skips information", () => {
		const { issues, runtime } = start("format: 1\ncolour: red\n\n# Hi");
		expect(issues).toEqual([
			{
				severity: "warning",
				message: expect.stringMatching(/^Line 2, column 1: Unknown header key/),
			},
		]);
		expect(runtime.diagnostics.map((d) => d.code)).toEqual(["W301"]);
	});

	it("reports each problem once, although its slide mounts again", () => {
		const { runtime, issues } = start(
			"box:\n  a\n\n---\n\n# Two\n\n---\n\n# Three",
			[createBoxPlugin([], { needs: ["physics"] })],
		);
		runtime.navigator.last();
		runtime.navigator.first();
		expect(issues).toHaveLength(1);
	});

	it("gives blocks the registered animator, created with the theme and the motion", () => {
		const animator = createInstantAnimator();
		const create = vi.fn(() => animator);
		const contexts: BlockContext[] = [];
		start("box:\n  a", [
			contextSpy(contexts),
			{ kind: "adapter", adapter: "animator", create },
		]);
		expect(create).toHaveBeenCalledWith({
			theme: DEFAULT_THEME_TOKENS,
			motion: DEFAULT_MOTION_TOKENS,
		});
		const animate = vi.spyOn(animator, "animate");
		const target = document.createElement("div");
		contexts[0]?.animator.animate(target, { opacity: [0, 1] });
		expect(animate).toHaveBeenCalledWith(
			target,
			{ opacity: [0, 1] },
			undefined,
		);
	});

	it("gives blocks an animator without motion when none is registered", () => {
		const contexts: BlockContext[] = [];
		start("box:\n  a", [contextSpy(contexts)]);
		expect(contexts[0]?.animator.animate).toEqual(expect.any(Function));
	});

	it("gives blocks the stage, the events and the embedded assets", () => {
		const contexts: BlockContext[] = [];
		const logo = { kind: "image", url: "data:," } as const;
		const registry = createPluginRegistry();
		registry.register(contextSpy(contexts));
		const root = document.createElement("div");
		document.body.append(root);
		runtime = createRuntime({
			root,
			source: "box:\n  a",
			registry,
			assets: new Map([["image:logo.png", logo]]),
		});
		const context = contexts[0];
		expect(context?.stage).toBe(runtime.stage.info);
		expect(context?.assets.resolve("image:logo.png")).toBe(logo);
		expect(context?.assets.resolve("image:other.png")).toBeNull();
		const handler = vi.fn();
		context?.events.on("box:step", handler);
		context?.events.emit("box:step", 1);
		expect(handler).toHaveBeenCalledWith(1);
	});

	it("removes the deck and stops listening when destroyed", () => {
		const log: BoxLog = [];
		const { root, runtime } = start("box:\n  a\n\n---\n\nbox:\n  b", [
			createBoxPlugin(log),
		]);
		runtime.destroy();
		expect(root.children).toHaveLength(0);
		expect(log).toEqual(["mount:a", "mount:b", "destroy:a", "destroy:b"]);
		press("ArrowRight");
		expect(runtime.navigator.position).toEqual({ slide: 0, step: 0 });
	});

	it("emits the lifecycle events of slides and clicks, in order", () => {
		const { runtime } = start("box:\n  a\n\n---\n\n# Two", [createBoxPlugin()]);
		const events: string[] = [];
		const record = (name: "slide:enter" | "slide:leave" | "step:change") =>
			runtime.events.on(name, (payload) =>
				events.push(`${name} ${JSON.stringify(payload)}`),
			);
		record("slide:enter");
		record("slide:leave");
		record("step:change");
		runtime.navigator.next();
		runtime.navigator.next();
		expect(events).toEqual([
			'step:change {"slide":0,"step":1}',
			'slide:leave {"slide":0}',
			'slide:enter {"slide":1}',
			'step:change {"slide":1,"step":0}',
		]);
	});

	it("tells the blocks of the first slide that it entered", () => {
		const entered = vi.fn();
		const box = createBoxPlugin();
		const listener: BlockPlugin<BoxModel> = {
			...box,
			view: {
				type: "box",
				mount(model, el, ctx) {
					ctx.events.on("slide:enter", entered);
					return box.view.mount(model, el, ctx);
				},
			},
		};
		start("box:\n  a", [listener]);
		expect(entered).toHaveBeenCalledExactlyOnceWith({ slide: 0 });
	});

	it("plays the clicks of the current slide on its blocks", () => {
		const log: BoxLog = [];
		const { runtime } = start("box:\n  a\n  b", [
			createBoxPlugin(log, { logSteps: true }),
		]);
		runtime.navigator.next();
		expect(log).toEqual(["mount:a", "set:a:0", "play:a:0-1"]);
	});

	it("writes the deck's theme as CSS variables on the viewport", () => {
		const { runtime } = start("color: #0a7\n\n# One");
		const { viewport } = runtime.stage;
		expect(viewport.style.getPropertyValue("--color-primary")).toBe("#0a7");
		expect(viewport.style.getPropertyValue("--adk-duration-m")).toBe("600ms");
		expect(runtime.theme.theme.colors.primary).toBe("#0a7");
	});

	it("shows every problem on its slide in a preview", () => {
		const { root } = start(
			"watermark: maybe\n\n# One\n\n---\n\nslide: transition=spin\n\n# Two",
		);
		const cards = root.querySelectorAll(".adk-error-card");
		expect(cards).toHaveLength(2);
		expect(
			root.querySelector(".adk-slide[data-index='0'] .adk-error-card li")
				?.textContent,
		).toContain("Line 1, column");
	});

	it("shows only errors when asked to", () => {
		const { root } = start("watermark: maybe\n\n# One", [], {
			problems: "errors",
		});
		expect(root.querySelector(".adk-error-card")).toBeNull();
	});

	it("shows the watermark unless the deck turns it off", () => {
		const shown = start("# One");
		expect(
			shown.root.querySelector(".adk-stage > .adk-watermark")?.textContent,
		).toBe("Made with AddonDeck");
		runtime?.destroy();
		const hidden = start("watermark: off\n\n# One");
		expect(hidden.root.querySelector(".adk-watermark")).toBeNull();
	});

	it("lets the page hide or show the watermark whatever the deck says", () => {
		const hidden = start("# One", [], { watermark: false });
		expect(hidden.root.querySelector(".adk-watermark")).toBeNull();
		runtime?.destroy();
		const shown = start("watermark: off\n\n# One", [], { watermark: true });
		expect(shown.root.querySelector(".adk-watermark")).not.toBeNull();
	});

	it("words the watermark from the active language", () => {
		const { root } = start("# One", [], {
			messages: { watermark: "Hecho con AddonDeck" },
		});
		expect(root.querySelector(".adk-watermark")?.textContent).toBe(
			"Hecho con AddonDeck",
		);
	});
});
