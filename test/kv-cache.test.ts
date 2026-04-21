import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetcher } from "itty-fetcher";
import { createCachedFetcherGet } from "../src/kv";

describe("createCachedFetcherGet", () => {
	test("caches within TTL and refetches after expiry", async () => {
		const dir = await mkdtemp(join(tmpdir(), "hypersnappa-lmdb-"));
		const cachePath = join(dir, "neynar-cache");

		let nowMs = 1_000_000;
		let calls = 0;
		const fetchJson = async <T>(_url: string) => {
			calls++;
			return { n: calls } as T;
		};

		const cachedGet = createCachedFetcherGet(fetcher({}), {
			cachePath,
			now: () => nowMs,
			fetchJson,
		});

		const first = await cachedGet<{ n: number }>("/x", 60);
		expect(first.n).toBe(1);
		expect(calls).toBe(1);

		const second = await cachedGet<{ n: number }>("/x", 60);
		expect(second.n).toBe(1);
		expect(calls).toBe(1);

		nowMs += 60_001; // expire (> 60s)
		const third = await cachedGet<{ n: number }>("/x", 60);
		expect(third.n).toBe(2);
		expect(calls).toBe(2);

		await rm(dir, { recursive: true, force: true });
	});
});
