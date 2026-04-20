import type {
	BulkUsersResponse,
	CastParamType,
	CastResponse,
	ChannelResponse,
	ChannelType,
	FollowersResponse,
} from "@neynar/nodejs-sdk/build/api";
import { fetcher } from "itty-fetcher";
import { open, type RootDatabase } from "lmdb";
import { NEYNAR_API_KEY } from "./env";

const DEFAULT_NEYNAR_LMDB_PATH = ".cache/neynar-lmdb";

const neynarApi = fetcher({
	base: "https://api.neynar.com",
	headers: {
		accept: "application/json",
		"x-api-key": NEYNAR_API_KEY,
	},
});

const LONG_TTL = 30 * 24 * 60 * 60; // 30 days
const SHORT_TTL = 24 * 60 * 60; // 1 day

type NeynarCacheEntry = { exp: number; body: unknown };

export function createCachedFetcherGet(options?: {
	cachePath?: string;
	now?: () => number;
	mapSize?: number;
	fetchJson?: <T>(url: string) => Promise<T>;
	logger?: (line: string) => void;
}) {
	const cachePath = options?.cachePath ?? DEFAULT_NEYNAR_LMDB_PATH;
	const now = options?.now ?? Date.now;
	const mapSize = options?.mapSize ?? 256 * 1024 * 1024;
	const fetchJson =
		options?.fetchJson ?? (<T,>(url: string) => neynarApi.get<T>(url));
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

export const lookupCastByHashOrWarpcastUrl = async (hashOrUrl: string) => {
	const type: CastParamType =
		hashOrUrl.startsWith("https://warpcast.com/") ||
		hashOrUrl.startsWith("https://farcaster.xyz/")
			? "url"
			: "hash";

	try {
		const res = await cachedFetcherGet<CastResponse>(
			`/v2/farcaster/cast?identifier=${encodeURIComponent(
				hashOrUrl,
			)}&type=${type}`,
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

export const getFollowing = async (fid: number) => {
	const res = await cachedFetcherGet<FollowersResponse>(
		`/v2/farcaster/following?fid=${fid}&sort_type=desc_chron&limit=100`,
		1,
	);
	return res;
};
