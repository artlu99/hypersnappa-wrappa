import { describe, expect, test } from "bun:test";

import { getTimestampFromFarcasterTimestamp } from "../src/hubs";

describe("Farcaster timestamps", () => {
	test("a recent Farcaster timestamp is in the past", () => {
		const recentTimestamp = 167194617;
        const now = Date.now();
		const farcasterTimestamp = getTimestampFromFarcasterTimestamp(recentTimestamp);

		expect(farcasterTimestamp).toBeLessThan(now);
	});
});
