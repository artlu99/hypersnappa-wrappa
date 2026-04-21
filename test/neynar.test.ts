import { describe, expect, test } from "bun:test";
import { isCastUrl } from "../src/neynar";

describe("isCastUrl", () => {
	test("warpcast URL returns true", () => {
		expect(isCastUrl("https://warpcast.com/user/0xabc123")).toBe(true);
	});

	test("farcaster.xyz URL returns true", () => {
		expect(isCastUrl("https://farcaster.xyz/user/0xabc123")).toBe(true);
	});

	test("farcaster.xyz/miniapps/ returns false", () => {
		expect(isCastUrl("https://farcaster.xyz/miniapps/something")).toBe(false);
	});

	test("non-cast URL returns false", () => {
		expect(isCastUrl("https://example.com")).toBe(false);
	});

	test("empty string returns false", () => {
		expect(isCastUrl("")).toBe(false);
	});

	test("warpcast bare domain returns false (no trailing slash)", () => {
		expect(isCastUrl("https://warpcast.com")).toBe(false);
	});

	test("farcaster.xyz bare domain returns false (no trailing slash)", () => {
		expect(isCastUrl("https://farcaster.xyz")).toBe(false);
	});

	test("http (not https) returns false", () => {
		expect(isCastUrl("http://warpcast.com/user/0xabc")).toBe(false);
	});
});
