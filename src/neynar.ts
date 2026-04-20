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
import { open, type RootDatabase } from "lmdb";
import invariant from "tiny-invariant";
import { NEYNAR_API_KEY } from "./env";
import { urlToCastHash } from "./shim";

const DEFAULT_NEYNAR_LMDB_PATH = ".cache/neynar-lmdb";
const DEFAULT_NEYNAR_PROVIDER: KnownNeynarApis = "quilibrium";
const SHIM_LOOKBACK = 500;

interface NeynarApi {
	shortname: string;
	url: string;
	api_key?: string;
}

const knownNeynarApis: NeynarApi[] = [
	{
		shortname: "neynar",
		url: "api.neynar.com",
		api_key: NEYNAR_API_KEY,
	},
	{
		shortname: "quilibrium",
		url: "haatz.quilibrium.com",
		api_key: undefined,
	},
];
type KnownNeynarApis = "neynar" | "quilibrium";

const getNeynarApi = (shortname: KnownNeynarApis): NeynarApi => {
	const api = knownNeynarApis.find((api) => api.shortname === shortname);
	invariant(api, `Neynar API ${shortname} not found`);

	return api;
};

const neynarApi = (shortname: KnownNeynarApis = DEFAULT_NEYNAR_PROVIDER) => {
	const api = getNeynarApi(shortname);
	return fetcher({
		base: `https://${api.url}`,
		headers: {
			accept: "application/json",
			...(api.api_key ? { "x-api-key": api.api_key } : {}),
		},
	});
};

const LONG_TTL = 30 * 24 * 60 * 60; // 30 days
const SHORT_TTL = 24 * 60 * 60; // 1 day

type NeynarCacheEntry = { exp: number; body: unknown };

export function createCachedFetcherGet(
	neynarProvider: KnownNeynarApis = DEFAULT_NEYNAR_PROVIDER,
	options?: {
		cachePath?: string;
		now?: () => number;
		mapSize?: number;
		fetchJson?: <T>(url: string) => Promise<T>;
		logger?: (line: string) => void;
	},
) {
	const cachePath = options?.cachePath ?? DEFAULT_NEYNAR_LMDB_PATH;
	const now = options?.now ?? Date.now;
	const mapSize = options?.mapSize ?? 256 * 1024 * 1024;
	const fetchJson =
		options?.fetchJson ??
		(<T>(url: string) => neynarApi(neynarProvider).get<T>(url));
	const logger = options?.logger ?? (() => {});

	let db: RootDatabase<NeynarCacheEntry, string> | null = null;
	const getDb = () => {
		if (!db) {
			db = open<NeynarCacheEntry, string>({
				path: cachePath,
				encoding: "json",
				mapSize,
			});
		}
		return db;
	};

	return async function cachedFetcherGet<T>(url: string, ttlSeconds: number) {
		const key = `neynar:${url}`;
		const db = getDb();
		const cached = db.get(key);

		if (cached && typeof cached.exp === "number") {
			if (now() < cached.exp) {
				logger(`Cache hit for ${url}`);
				return cached.body as T;
			}
			db.removeSync(key);
		}

		const res = await fetchJson<T>(url);
		db.putSync(key, {
			exp: now() + ttlSeconds * 1000,
			body: res,
		});
		logger(`Cache set for ${url} with TTL ${ttlSeconds}`);
		return res as T;
	};
}

const cachedFetcherGet = createCachedFetcherGet();

export const lookupCastByHashOrWarpcastUrl = async (
	hashOrUrl: string,
	shimLookback: number = SHIM_LOOKBACK,
) => {
	const inputType: CastParamType =
		hashOrUrl.startsWith("https://warpcast.com/") ||
		hashOrUrl.startsWith("https://farcaster.xyz/")
			? "url"
			: "hash";

	const fullHash = inputType === "url" ? 
		 await urlToCastHash(hashOrUrl, shimLookback) : hashOrUrl;
	invariant(fullHash, `Cast not found: ${hashOrUrl}`);

	try {
		const res = await cachedFetcherGet<CastResponse>(
			`/v2/farcaster/cast?identifier=${encodeURIComponent(
				fullHash,
			)}&type=${inputType === "url" ? "hash" : "hash"}`,
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
	const res = await cachedFetcherGet<FollowersResponse>(
		`/v2/farcaster/following?fid=${fid}&sort_type=desc_chron&limit=100`,
		1,
	);
	return res;
};
