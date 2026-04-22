import { describe, expect, test } from "bun:test";
import { base, mainnet } from "viem/chains";
import { getToken } from "../src/tokens";

describe("getToken", () => {
	test("returns the correct token", async () => {
		const token = await getToken("USDC", "base");
		expect(token).toEqual({
			symbol: "USDC",
			contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
			chainId: base.id,
		});
	});

	test("returns the correct token for Ethereum", async () => {
		const token = await getToken("USDC", "ethereum");
		expect(token).toEqual({
			symbol: "USDC",
			contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			chainId: mainnet.id,
		});
	});

	test("returns undefined if the token is not found", async () => {
		const token = await getToken("INVALID", "base");
		expect(token).toBeUndefined();
	});
});
