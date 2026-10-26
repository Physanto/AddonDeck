// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Every diagnostic code of the format, with its severity and the parameters its
 * message needs. The specification describes when each one is reported.
 *
 * `E1xx` structure, `E2xx` blocks, `W3xx` recoverable problems, `I4xx` information.
 */
export const DIAGNOSTIC_CODES = {
	E101: { severity: "error", params: ["version", "supported"] },
	E102: { severity: "error", params: ["value"] },
	E201: { severity: "error", params: ["type", "reason"] },
	E202: { severity: "error", params: ["id", "firstLine"] },
	E203: { severity: "error", params: ["id"] },
	E204: { severity: "error", params: ["id"] },
	W301: { severity: "warning", params: ["key"] },
	W302: { severity: "warning", params: ["key", "firstLine"] },
	W303: { severity: "warning", params: ["key", "value"] },
	W304: { severity: "warning", params: ["keyword"] },
	W305: { severity: "warning", params: ["type"] },
	W306: { severity: "warning", params: ["keyword"] },
	W307: { severity: "warning", params: ["step"] },
	W308: { severity: "warning", params: ["option"] },
	W309: { severity: "warning", params: ["option", "value", "fallback"] },
	W310: { severity: "warning", params: ["step"] },
	W311: { severity: "warning", params: ["openLine"] },
	W312: { severity: "warning", params: [] },
	W313: { severity: "warning", params: [] },
	W314: { severity: "warning", params: ["word"] },
	I401: { severity: "info", params: ["supported"] },
	I402: { severity: "info", params: [] },
	I403: { severity: "info", params: ["keyword"] },
} as const;

/** A diagnostic code defined by the format. */
export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

/** The parameters the message of code `C` needs. */
export type DiagnosticParamsOf<C extends DiagnosticCode> = Readonly<
	Record<(typeof DIAGNOSTIC_CODES)[C]["params"][number], string | number>
>;
