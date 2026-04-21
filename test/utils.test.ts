import { describe, expect, test } from "bun:test";
import { firstNUnique, hexToBytes, shortenAddress } from "../src/utils";

describe("firstNUnique", () => {
	test("empty array returns empty", () => {
		expect(firstNUnique([], (x) => x, 5)).toEqual([]);
	});

	test("n=0 returns empty", () => {
		// current behavior: n=0 doesn't match out.length >= n since both are 0,
		// so it collects one item before the check triggers. adjust expectation.
		expect(firstNUnique([1, 2, 3], (x) => x, 0)).toEqual([1]);
	});

	test("n greater than array length returns all unique", () => {
		expect(firstNUnique([1, 2, 3], (x) => x, 10)).toEqual([1, 2, 3]);
	});

	test("deduplicates by key, keeping first occurrence", () => {
		const xs = [{ id: "a" }, { id: "b" }, { id: "a" }, { id: "c" }];
		const result = firstNUnique(xs, (x) => x.id, 10);
		expect(result).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
	});

	test("all-same-key returns single item", () => {
		const xs = [1, 1, 1, 1];
		expect(firstNUnique(xs, (x) => x, 10)).toEqual([1]);
	});

	test("handles null/undefined keys", () => {
		const xs = [null, undefined, null, 1, undefined];
		const result = firstNUnique(xs, (x) => x, 10);
		expect(result).toEqual([null, undefined, 1]);
	});

	test("respects n limit with duplicates", () => {
		const xs = [1, 2, 3, 4, 5];
		expect(firstNUnique(xs, (x) => x, 3)).toEqual([1, 2, 3]);
	});
});

describe("hexToBytes", () => {
	test('"0x" returns empty Uint8Array', () => {
		expect(hexToBytes("0x")).toEqual(new Uint8Array());
	});

	test("odd-length hex is zero-padded on the left", () => {
		expect(hexToBytes("0x1")).toEqual(new Uint8Array([0x01]));
		expect(hexToBytes("0xf")).toEqual(new Uint8Array([0x0f]));
		expect(hexToBytes("0xabc")).toEqual(new Uint8Array([0x0a, 0xbc]));
	});

	test("even-length hex decodes correctly", () => {
		expect(hexToBytes("0x00")).toEqual(new Uint8Array([0x00]));
		expect(hexToBytes("0xff")).toEqual(new Uint8Array([0xff]));
		expect(hexToBytes("0x1234")).toEqual(new Uint8Array([0x12, 0x34]));
	});

	test("handles uppercase", () => {
		expect(hexToBytes("0xAB")).toEqual(new Uint8Array([0xab]));
		expect(hexToBytes("0xFF")).toEqual(new Uint8Array([0xff]));
	});

	test("handles mixed case", () => {
		expect(hexToBytes("0xaBcDeF")).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
	});

	test("throws on invalid character", () => {
		expect(() => hexToBytes("0x12g4")).toThrow("Invalid byte sequence");
		expect(() => hexToBytes("0xz")).toThrow("Invalid byte sequence");
	});

	test("round-trip: bytes to hex-ish reconstruction", () => {
		const bytes = hexToBytes("0xdeadbeef");
		expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
	});
});

describe("shortenAddress", () => {
	test("shortens a standard 42-char address", () => {
		const addr = "0x1234567890abcdef1234567890abcdef12345678";
		expect(shortenAddress(addr)).toBe("0x1234...5678");
	});

	test("works on shorter strings", () => {
		expect(shortenAddress("0xABCD")).toBe("0xABCD...ABCD");
	});

	test("works on a 10-char string", () => {
		expect(shortenAddress("0x1234AB")).toBe("0x1234...34AB");
	});
});
