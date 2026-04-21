import type {
	BulkUsersResponse,
	CastParamType,
	CastResponse,
	ChannelResponse,
	ChannelType,
	FollowersResponse,
	UserResponse,
} from "@neynar/nodejs-sdk/build/api";
import { fetcher } from "itty-fetcher";
import invariant from "tiny-invariant";
import { NEYNAR_API_KEY } from "./env";
import { createCachedFetcherGet } from "./kv";
import { urlToCastHash } from "./shim";

const DEFAULT_NEYNAR_PROVIDER: KnownNeynarProviders = "quilibrium";
const LONG_TTL = 30 * 24 * 60 * 60; // 30 days
const SHORT_TTL = 24 * 60 * 60; // 1 day
const SHIM_LOOKBACK = 500;

interface NeynarProvider {
	name: string;
	url: string;
	api_key?: string;
}

const knownNeynarProviders: NeynarProvider[] = [
	{
		name: "neynar",
		url: "api.neynar.com",
		api_key: NEYNAR_API_KEY,
	},
	{
		name: "quilibrium",
		url: "haatz.quilibrium.com",
		api_key: undefined,
	},
];
export type KnownNeynarProviders = "neynar" | "quilibrium";

const getNeynarApi = (name: KnownNeynarProviders): NeynarProvider => {
	const api = knownNeynarProviders.find((api) => api.name === name);
	invariant(api, `Neynar API ${name} not found`);

	return api;
};

export const neynarApi = (name: KnownNeynarProviders) => {
	const api = getNeynarApi(name);
	return fetcher({
		base: `https://${api.url}`,
		headers: {
			accept: "application/json",
			...(api.api_key ? { "x-api-key": api.api_key } : {}),
		},
	});
};

const cachedFetcherGet = createCachedFetcherGet(
	neynarApi(DEFAULT_NEYNAR_PROVIDER),
);

export const lookupCastByHashOrWarpcastUrl = async (
	hashOrUrl: string,
	shimLookback: number = SHIM_LOOKBACK,
) => {
	// Neynar can handle both hash and URL, but Quilibrium doesn't support URLs
	// so we handle both cases with the same approach:
	// 1. check if the input is a URL
	// 2. if it is, convert it to a hash
	// 3. if it is not, use the hash as is
	// 4. fetch the cast from the API
	// 5. return the cast

	const inputType: CastParamType =
		hashOrUrl.startsWith("https://warpcast.com/") ||
		hashOrUrl.startsWith("https://farcaster.xyz/")
			? "url"
			: "hash";

	const fullHash =
		inputType === "url"
			? await urlToCastHash(hashOrUrl, shimLookback)
			: hashOrUrl;
	invariant(fullHash, `Cast not found: ${hashOrUrl}`);

	try {
		const res = await cachedFetcherGet<CastResponse>(
			`/v2/farcaster/cast?identifier=${encodeURIComponent(fullHash)}&type=hash`,
			LONG_TTL,
		);
		return res;
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : JSON.stringify(error),
		);
		return null;
	}
};

export const lookupChannelByIdOrParentUrl = async (idOrUrl: string) => {
	const type: ChannelType = idOrUrl.startsWith("https://warpcast.com/")
		? "parent_url"
		: "id";

	try {
		const res = await cachedFetcherGet<ChannelResponse>(
			`/v2/farcaster/channel?id=${encodeURIComponent(idOrUrl)}&type=${type}`,
			LONG_TTL,
		);
		return res;
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : JSON.stringify(error),
		);
		return null;
	}
};

export const getUserInfo = async (fid: number) => {
	try {
		const res = await cachedFetcherGet<BulkUsersResponse>(
			`/v2/farcaster/user/bulk?fids=${fid}`,
			SHORT_TTL,
		);
		return res.users[0];
	} catch (error) {
		console.error("Error fetching user info:", error);
		return undefined;
	}
};

export const getUserByUsername = async (username: string) => {
	try {
		const res = await cachedFetcherGet<UserResponse>(
			`/v2/farcaster/user/by_username/?username=${username}`,
			SHORT_TTL,
		);
		return res.user;
	} catch (error) {
		console.error("Error fetching user info:", error);
		return undefined;
	}
};

export const getFollowing = async (fid: number) => {
	try {
		const res = await cachedFetcherGet<FollowersResponse>(
			`/v2/farcaster/following?fid=${fid}&sort_type=desc_chron&limit=100`,
			1, // ttl needs to be even shorter to catch real follows in time
		);
		return res;
	} catch (error) {
		console.error("Error fetching following:", error);
		return undefined;
	}
};
