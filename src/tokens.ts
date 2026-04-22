import { fetcher } from "itty-fetcher";
import { sort } from "radash";
import { base, mainnet } from "viem/chains";
import { createCachedFetcherGet } from "./kv";

interface CoinGeckoToken {
	id: string;
	name: string;
	symbol: string;
	platforms?: {
		[key in "ethereum" | "base"]: string;
	};
}

export interface Token {
	symbol: string;
	contractAddress: string;
	chainId: number;
}

const client = fetcher({
	base: "https://api.coingecko.com/api/v3",
	headers: {
		"Content-Type": "application/json",
	},
});

const cachedFetcherGet = createCachedFetcherGet(client, {
	keyPrefix: "coingecko:",
});

export const getToken = async (
	token: string,
	platform: "ethereum" | "base" = "base",
): Promise<Token | undefined> => {
	const tokens = await cachedFetcherGet<CoinGeckoToken[]>(
		"/coins/list?include_platform=true&active=true",
		60 * 60 * 24,
	);
	return sort(
		tokens
			.filter((t) => t.symbol.toLowerCase() === token.toLowerCase())
			.map((t) => ({
				...t,
				numPlatforms: Object.keys(t.platforms ?? {}).length,
			})),
		(t) => t.numPlatforms,
		true,
	)
		.map((t) => ({
			symbol: t.symbol.toUpperCase(),
			contractAddress: t.platforms?.[platform],
			chainId: platform === "base" ? base.id : mainnet.id,
		}))
		.filter(
			(
				t,
			): t is Omit<typeof t, "contractAddress"> & { contractAddress: string } =>
				t.contractAddress !== undefined,
		)
		.find((t) => t.symbol === token.toUpperCase());
};
