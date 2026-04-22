import { fetcher } from "itty-fetcher";
import { createCachedFetcherGet } from "./kv";

interface CoinbasePriceResponse {
	data: { amount: string; base: string; currency: string };
}

const client = fetcher({
	base: "https://api.coinbase.com/v2",
	headers: {
		"Content-Type": "application/json",
	},
});

const cachedFetcherGet = createCachedFetcherGet(client, {
	keyPrefix: "coinbase:",
});

export const getTokenPrice = async (token: string, base: string = "USD") => {
	const key = `/prices/${token}-${base}/spot`;
	const response = await cachedFetcherGet<CoinbasePriceResponse>(key, 30 * 60); // 30 minutes
	return Number(response.data.amount);
};
