import invariant from "tiny-invariant";
import { getCasts, getFidFromUsername } from "./hypersnap";

const MAX_LOOKBACK = 1000;

export const urlToCastHash = async (
	url: string,
	lookback: number = MAX_LOOKBACK,
): Promise<string | undefined> => {
	invariant(lookback <= MAX_LOOKBACK, `Lookback ${lookback} > ${MAX_LOOKBACK}`);

	const [_protocol, _slash, _domain, username, shortHash] = url.split("/");
	invariant(username, `Username is required: ${url}`);
	invariant(shortHash, `Short hash is required: ${url}`);
	invariant(
		shortHash.length === 10,
		`Short hash must be 10 characters: ${shortHash}`,
	);
	invariant(
		shortHash.startsWith("0x"),
		`Short hash must start with 0x: ${shortHash}`,
	);

	// 1. resolve the user to FID
	const fid = await getFidFromUsername(username);
	invariant(fid, `User not found: ${username}`);

	// 2. get the casts for the user
	const casts = await getCasts(fid, true, lookback);
	const castHashes = casts
		.map((c) => c?.hash?.toString())
		.filter((h) => h !== null);

	return castHashes.find((h) => h.slice(0, 10) === shortHash);
};
