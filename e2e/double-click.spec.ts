// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Page, test } from "@playwright/test";
import { EXPORTED, exampleDecks } from "./examples";

/** Most key presses an example needs to go from its start to its end. */
const MAX_PRESSES = 100;

/**
 * Example decks that already show blocks which do not exist yet. The page
 * reports each one as unregistered, and nothing else is tolerated. Once the
 * block exists the report is gone and the test fails until the entry is
 * removed, so no entry outlives its block.
 */
const BLOCKS_TO_COME: Readonly<Record<string, readonly string[]>> = {
	"online-payment": ["sequence"],
};

function unregistered(block: string): RegExp {
	return new RegExp(`the block "${block}" is not registered`);
}

interface Position {
	readonly slide: number;
	readonly step: number;
}

declare global {
	interface Window {
		readonly AddonDeck: {
			start(): {
				readonly navigator: {
					readonly position: Position;
					readonly slideCount: number;
				};
			} | null;
		};
	}
}

function position(page: Page): Promise<Position> {
	return page.evaluate(() => {
		const runtime = window.AddonDeck.start();
		if (runtime === null) throw new Error("The deck did not start.");
		return { ...runtime.navigator.position };
	});
}

/** Presses `key` until the position stops changing; each press must move one way. */
async function pressToTheEnd(
	page: Page,
	key: "ArrowRight" | "ArrowLeft",
): Promise<Position> {
	const sign = key === "ArrowRight" ? 1 : -1;
	let current = await position(page);
	for (let press = 0; press < MAX_PRESSES; press++) {
		await page.keyboard.press(key);
		const next = await position(page);
		if (next.slide === current.slide && next.step === current.step) {
			return current;
		}
		const moved =
			next.slide === current.slide
				? Math.sign(next.step - current.step)
				: Math.sign(next.slide - current.slide);
		expect(moved, `${key} from ${JSON.stringify(current)}`).toBe(sign);
		await expect(
			page.locator('.adk-slide[data-state="current"]'),
		).toHaveAttribute("data-index", String(next.slide));
		current = next;
	}
	throw new Error(`${key} never reached the end of the deck.`);
}

for (const name of exampleDecks()) {
	test(`${name}.deck opens from file:// and navigates both ways`, async ({
		page,
	}) => {
		const problems: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") problems.push(message.text());
		});
		page.on("pageerror", (error) => problems.push(error.message));

		await page.goto(pathToFileURL(join(EXPORTED, `${name}.html`)).href);
		const current = page.locator('.adk-slide[data-state="current"]');
		await expect(current).toHaveAttribute("data-index", "0");
		await expect(current).not.toBeEmpty();
		await expect(page.locator(".adk-watermark")).toBeVisible();
		await expect(page.locator(".adk-error-card")).toHaveCount(0);

		const slideCount = await page.evaluate(
			() => window.AddonDeck.start()?.navigator.slideCount ?? 0,
		);
		const end = await pressToTheEnd(page, "ArrowRight");
		expect(end.slide).toBe(slideCount - 1);
		expect(page.url()).toMatch(new RegExp(`#/${slideCount}(/\\d+)?$`));

		const start = await pressToTheEnd(page, "ArrowLeft");
		expect(start).toEqual({ slide: 0, step: 0 });
		expect(page.url()).toMatch(/#\/1$/);

		const toCome = BLOCKS_TO_COME[name] ?? [];
		for (const block of toCome) {
			expect(problems, `${block} is reported as unregistered`).toContainEqual(
				expect.stringMatching(unregistered(block)),
			);
		}
		expect(
			problems.filter(
				(problem) => !toCome.some((block) => unregistered(block).test(problem)),
			),
		).toEqual([]);
	});
}
