import { describe, expect, test } from "bun:test";
import { FARCASTER_EPOCH } from "@farcaster/core";
import { getTimestamp, getTimestampFromFarcasterTimestamp } from "../src/hubs";

describe("Farcaster timestamps", () => {
	test("epoch (0) equals FARCASTER_EPOCH constant", () => {
		expect(getTimestampFromFarcasterTimestamp(0)).toBe(FARCASTER_EPOCH);
	});

	test("a recent Farcaster timestamp is in the past", () => {
		const recentTimestamp = 167194617;
		const now = Date.now();
		const farcasterTimestamp =
			getTimestampFromFarcasterTimestamp(recentTimestamp);

		expect(farcasterTimestamp).toBeLessThan(now);
	});

	test("each Farcaster second adds 1000ms", () => {
		const t0 = getTimestampFromFarcasterTimestamp(0);
		const t1 = getTimestampFromFarcasterTimestamp(1);
		expect(t1 - t0).toBe(1000);
	});
});

describe("getTimestamp", () => {
	test("epoch 0 produces correct ISO string", () => {
		expect(getTimestamp(0)).toBe("1970-01-01T00:00:00.000Z");
	});

	test("returns valid ISO string for a known timestamp", () => {
		expect(getTimestamp(FARCASTER_EPOCH)).toBe("2021-01-01T00:00:00.000Z");
	});
});
