import { describe, expect, test } from "bun:test";
import { HUB_POST_CONFIG } from "../src/hypersnap";

describe("hub post config", () => {
	test("does not JSON-encode protobuf bytes", () => {
		expect(HUB_POST_CONFIG.encode).toBe(false);
		expect(HUB_POST_CONFIG.headers["Content-Type"]).toBe(
			"application/octet-stream",
		);
	});
});
