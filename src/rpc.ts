import { fetcher } from "itty-fetcher";

// https://github.com/stephancill/rpc-racer
const RPC_RACER = "https://evm.stupidtech.net/v1";

const client = fetcher({
	base: RPC_RACER,
	headers: { "Content-Type": "application/json" },
});

type RpcOk = { jsonrpc: "2.0"; id: number; result: string };
type RpcErr = { jsonrpc: "2.0"; id: number; error: unknown };

export const getBalance = async (
	address: string,
	chainId: number,
): Promise<number> => {
	const response = await client.post(`/${chainId}`, {
		jsonrpc: "2.0",
		method: "eth_getBalance",
		params: [address, "latest"],
		id: 1,
	});
	return Number(BigInt(response.result)) / 1e18;
};

export const getTokenBalance = async (
	address: string,
	contractAddress: string,
	chainId: number,
): Promise<number> => {
	const decimalsCall = {
		jsonrpc: "2.0",
		method: "eth_call",
		params: [{ to: contractAddress, data: "0x313ce567" }, "latest"],
		id: 1,
	} as const;

	const balanceOfCall = {
		jsonrpc: "2.0",
		method: "eth_call",
		params: [
			{
				to: contractAddress,
				data: `0x70a08231${address.replace("0x", "").padStart(64, "0")}`,
			},
			"latest",
		],
		id: 2,
	} as const;

	let decimalsHex: string | undefined;
	let balanceHex: string | undefined;

	// Try JSON-RPC batch (one HTTP request). If unsupported, fall back.
	try {
		const batchRes = await client.post<
			Array<typeof decimalsCall | typeof balanceOfCall>,
			Array<RpcOk | RpcErr>
		>(`/${chainId}`, [decimalsCall, balanceOfCall]);

		if (Array.isArray(batchRes)) {
			const byId = new Map<number, RpcOk | RpcErr>(
				batchRes
					.filter(
						(r): r is RpcOk | RpcErr =>
							!!r && typeof (r as { id?: unknown }).id === "number",
					)
					.map((r) => [r.id, r]),
			);

			const d = byId.get(1);
			const b = byId.get(2);

			if (d && "result" in d && typeof d.result === "string")
				decimalsHex = d.result;
			if (b && "result" in b && typeof b.result === "string")
				balanceHex = b.result;
		}
	} catch {
		// ignore and fall back
	}

	if (!decimalsHex || !balanceHex) {
		const decimalsResponse = await client.post<typeof decimalsCall, RpcOk>(
			`/${chainId}`,
			decimalsCall,
		);
		const balanceOfResponse = await client.post<typeof balanceOfCall, RpcOk>(
			`/${chainId}`,
			balanceOfCall,
		);
		decimalsHex = decimalsResponse.result;
		balanceHex = balanceOfResponse.result;
	}

	const decimals = Number(BigInt(decimalsHex));
	return Number(BigInt(balanceHex)) / 10 ** decimals;
};
