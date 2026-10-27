// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Records what a block leaves active, between {@link trackLeaks} and `restore`. */
export interface LeakTracker {
	/**
	 * Describes the event listeners, timers and animation frames added since
	 * tracking started that are still active. Listeners on nodes that are no
	 * longer in the document are not leaks: they go away with their node.
	 */
	leaks(): string[];
	/** Puts back the original functions. Call it once, in a `finally`. */
	restore(): void;
}

interface Listener {
	readonly target: EventTarget;
	readonly type: string;
	readonly listener: EventListenerOrEventListenerObject;
	readonly capture: boolean;
}

type Options = boolean | AddEventListenerOptions | EventListenerOptions;

type TimerHost = Pick<
	typeof globalThis,
	"setTimeout" | "clearTimeout" | "setInterval" | "clearInterval"
> &
	Partial<
		Pick<typeof globalThis, "requestAnimationFrame" | "cancelAnimationFrame">
	>;

function captureOf(options: Options | undefined): boolean {
	return typeof options === "boolean" ? options : options?.capture === true;
}

function describeTarget(target: EventTarget): string {
	if (typeof window !== "undefined" && target === window) return "window";
	if (typeof document !== "undefined" && target === document) return "document";
	if (typeof Element !== "undefined" && target instanceof Element) {
		return `<${target.tagName.toLowerCase()}>`;
	}
	return target.constructor.name;
}

function isGone(target: EventTarget): boolean {
	return (
		typeof Node !== "undefined" && target instanceof Node && !target.isConnected
	);
}

type ListenerMethods = Pick<
	EventTarget,
	"addEventListener" | "removeEventListener"
>;

/** The prototype that defines `addEventListener`, which may be an ancestor of `EventTarget.prototype`. */
function definingPrototype(): ListenerMethods {
	let prototype: object | null = EventTarget.prototype;
	while (prototype !== null && !Object.hasOwn(prototype, "addEventListener")) {
		prototype = Object.getPrototypeOf(prototype);
	}
	return (prototype ?? EventTarget.prototype) as ListenerMethods;
}

/**
 * The objects whose listener methods are replaced. In some DOM environments
 * the global `EventTarget` is a subclass of the one nodes inherit from, and
 * the global window has methods of its own instead of the shared ones.
 */
function listenerOwners(): {
	readonly owner: ListenerMethods;
	readonly target: EventTarget | null;
}[] {
	const owners = [{ owner: definingPrototype(), target: null }];
	if (
		typeof window !== "undefined" &&
		Object.hasOwn(window, "addEventListener")
	) {
		return [...owners, { owner: window, target: window }];
	}
	return owners;
}

function trackListeners(): { leaks(): string[]; restore(): void } {
	const active: Listener[] = [];
	const indexOf = (
		target: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject,
		capture: boolean,
	): number =>
		active.findIndex(
			(entry) =>
				entry.target === target &&
				entry.type === type &&
				entry.listener === listener &&
				entry.capture === capture,
		);

	// Calls made while a listener method runs come from the DOM implementation
	// itself, such as the abort listener behind the `signal` option.
	let nested = 0;
	const owners = listenerOwners();
	const signalAdd = owners[0]?.owner.addEventListener;

	const restorers = owners.map(({ owner, target: fixed }) => {
		const add = owner.addEventListener;
		const remove = owner.removeEventListener;
		owner.addEventListener = function (
			this: EventTarget,
			type: string,
			listener: EventListenerOrEventListenerObject | null,
			options?: boolean | AddEventListenerOptions,
		): void {
			const target = fixed ?? this;
			nested++;
			try {
				add.call(target, type, listener, options);
			} finally {
				nested--;
			}
			if (nested > 0 || listener === null) return;
			const capture = captureOf(options);
			if (indexOf(target, type, listener, capture) !== -1) return;
			if (typeof options === "object" && options.signal?.aborted) return;
			const entry: Listener = { target, type, listener, capture };
			const forget = (): void => {
				const index = active.indexOf(entry);
				if (index !== -1) active.splice(index, 1);
			};
			active.push(entry);
			if (typeof options !== "object") return;
			nested++;
			try {
				if (options.once) {
					add.call(target, type, forget, { once: true, capture });
				}
				if (options.signal) {
					signalAdd?.call(options.signal, "abort", forget, { once: true });
				}
			} finally {
				nested--;
			}
		};
		owner.removeEventListener = function (
			this: EventTarget,
			type: string,
			listener: EventListenerOrEventListenerObject | null,
			options?: boolean | EventListenerOptions,
		): void {
			const target = fixed ?? this;
			remove.call(target, type, listener, options);
			if (listener === null) return;
			const index = indexOf(target, type, listener, captureOf(options));
			if (index !== -1) active.splice(index, 1);
		};
		return () => {
			owner.addEventListener = add;
			owner.removeEventListener = remove;
		};
	});

	return {
		leaks: () => [
			...new Set(
				active
					.filter((entry) => !isGone(entry.target))
					.map(
						(entry) =>
							`a "${entry.type}" listener on ${describeTarget(entry.target)}`,
					),
			),
		],
		restore() {
			for (const restore of restorers.reverse()) restore();
		},
	};
}

function trackTimers(host: TimerHost): { leaks(): string[]; restore(): void } {
	const original: TimerHost = {
		setTimeout: host.setTimeout,
		clearTimeout: host.clearTimeout,
		setInterval: host.setInterval,
		clearInterval: host.clearInterval,
		requestAnimationFrame: host.requestAnimationFrame,
		cancelAnimationFrame: host.cancelAnimationFrame,
	};
	const pending = new Map<unknown, string>();
	const clear = (id: unknown): void => {
		pending.delete(id);
	};

	const wrap =
		(schedule: typeof setTimeout, kind: string, once: boolean) =>
		(handler: unknown, ...rest: unknown[]): unknown => {
			if (typeof handler !== "function") {
				return Reflect.apply(schedule, host, [handler, ...rest]);
			}
			let id: unknown;
			const run = (...args: unknown[]): unknown => {
				if (once) pending.delete(id);
				return Reflect.apply(handler, undefined, args);
			};
			id = Reflect.apply(schedule, host, [run, ...rest]);
			pending.set(id, kind);
			return id;
		};

	const patch = host as unknown as Record<string, unknown>;
	patch.setTimeout = wrap(
		original.setTimeout,
		"a timeout that was never cleared",
		true,
	);
	patch.setInterval = wrap(
		original.setInterval as unknown as typeof setTimeout,
		"an interval that was never cleared",
		false,
	);
	patch.clearTimeout = (id: unknown) => {
		clear(id);
		Reflect.apply(original.clearTimeout, host, [id]);
	};
	patch.clearInterval = (id: unknown) => {
		clear(id);
		Reflect.apply(original.clearInterval, host, [id]);
	};
	const { requestAnimationFrame, cancelAnimationFrame } = original;
	if (
		requestAnimationFrame !== undefined &&
		cancelAnimationFrame !== undefined
	) {
		patch.requestAnimationFrame = (callback: FrameRequestCallback): number => {
			let id = 0;
			id = Reflect.apply(requestAnimationFrame, host, [
				(time: number) => {
					pending.delete(id);
					callback(time);
				},
			]);
			pending.set(id, "an animation frame that was never cancelled");
			return id;
		};
		patch.cancelAnimationFrame = (id: number) => {
			clear(id);
			Reflect.apply(cancelAnimationFrame, host, [id]);
		};
	}

	return {
		leaks: () => [...pending.values()],
		restore() {
			for (const [name, value] of Object.entries(original)) {
				if (value !== undefined) patch[name] = value;
			}
		},
	};
}

/**
 * Starts recording the event listeners, timers and animation frames that are
 * added, to find the ones still active later.
 *
 * It replaces `addEventListener`, `removeEventListener` and the timer
 * functions of the global object (and of `window`, when it is another object)
 * until `restore` is called.
 *
 * @example
 * ```ts
 * const tracker = trackLeaks();
 * try {
 *   instance = view.mount(model, el, ctx);
 *   instance.destroy();
 *   expect(tracker.leaks()).toEqual([]);
 * } finally {
 *   tracker.restore();
 * }
 * ```
 */
export function trackLeaks(): LeakTracker {
	const hosts: TimerHost[] = [globalThis];
	if (typeof window !== "undefined" && (window as unknown) !== globalThis) {
		hosts.push(window);
	}
	const trackers = [trackListeners(), ...hosts.map(trackTimers)];
	return {
		leaks: () => trackers.flatMap((tracker) => tracker.leaks()),
		restore() {
			for (const tracker of [...trackers].reverse()) tracker.restore();
		},
	};
}
