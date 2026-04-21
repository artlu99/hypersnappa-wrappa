import type { fetcher } from "itty-fetcher";
import { open, type RootDatabase } from "lmdb";

const DEFAULT_NEYNAR_LMDB_PATH = ".cache/neynar-lmdb";

type NeynarCacheEntry = { exp: number; body: unknown };

export function createCachedFetcherGet(
	fetcherFunc: ReturnType<typeof fetcher>,
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
		(<T>(url: string) => fetcherFunc.get<T>(url));
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
