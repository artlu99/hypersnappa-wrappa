import { describe, expect, test } from "bun:test";
import { CastType } from "@farcaster/core";
import { castTypeForText } from "../src/hypersnap";

describe("castTypeForText", () => {
	test("uses CAST at exactly 320 bytes (ASCII)", () => {
		const text = "a".repeat(320);
		expect(new TextEncoder().encode(text).length).toBe(320);
		expect(castTypeForText(text)).toBe(CastType.CAST);
	});

	test("uses LONG_CAST above 320 bytes (ASCII)", () => {
		const text = "a".repeat(321);
		expect(new TextEncoder().encode(text).length).toBe(321);
		expect(castTypeForText(text)).toBe(CastType.LONG_CAST);
	});

	test("counts bytes, not codepoints (unicode)", () => {
		// 😀 is 4 bytes in UTF-8
		const unit = "😀";
		expect(new TextEncoder().encode(unit).length).toBe(4);
		const text = unit.repeat(80); // 80 * 4 = 320 bytes
		expect(new TextEncoder().encode(text).length).toBe(320);
		expect(castTypeForText(text)).toBe(CastType.CAST);
		expect(castTypeForText(text + unit)).toBe(CastType.LONG_CAST);
	});

	test("empty string uses CAST", () => {
		expect(castTypeForText("")).toBe(CastType.CAST);
	});
});
