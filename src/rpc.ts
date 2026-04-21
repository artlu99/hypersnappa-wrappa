import { fetcher } from "itty-fetcher";

// https://github.com/stephancill/rpc-racer
const RPC_RACER = "https://evm.stupidtech.net/v1";

const client = fetcher({
	base: RPC_RACER,
	headers: { "Content-Type": "application/json" },
});

export const getBalance = async (
	address: string,
	chainId: number = 8453, // Base mainnet
): Promise<number> => {
	const response = await client.post(`/${chainId}`, {
		jsonrpc: "2.0",
		method: "eth_getBalance",
		params: [address, "latest"],
		id: 1,
	});
	return Number(BigInt(response.result)) / 1e18;
};

export const getUSDCBalance = async (address: string): Promise<number> => {
	// USDC on Base
	const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

	const response = await client.post(`/8453`, {
		jsonrpc: "2.0",
		method: "eth_call",
		params: [
			{
				// balanceOf(address) selector
				data: `0x70a08231${address.replace("0x", "").padStart(64, "0")}`,
				to: USDC,
			},
			"latest",
		],
		id: 1,
	});
	return Number(BigInt(response.result)) / 1e6;
};
