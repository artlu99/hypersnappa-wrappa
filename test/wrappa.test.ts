// biome-ignore-all lint/suspicious/noExplicitAny: test mock
import { describe, expect, test } from "bun:test";
import { createWrappa, type WrappaDeps } from "../src/wrappa";

const makeDeps = (overrides?: Partial<WrappaDeps>): WrappaDeps => {
	return {
		castReact: async () => new Response(),
		publishCast: async () => new Response(),
		lookupCastByHashOrWarpcastUrl: async () =>
			({
				cast: {
					author: { fid: 123 },
					hash: "0xabc",
				},
			}) as any,
		lookupChannelByIdOrParentUrl: async () =>
			({ channel: { parent_url: "https://example.com" } }) as any,
		hashOrUrlToEmbed: async () => ({ url: "https://example.com" }) as any,
		...overrides,
	};
};

describe("wrappa orchestration", () => {
	test("cast requires text", async () => {
		const wrappa = createWrappa(makeDeps());
		await expect(wrappa({ action: "cast", channelId: "dev" })).rejects.toThrow(
			"Text is required",
		);
	});

	test("like requires an existing cast", async () => {
		const wrappa = createWrappa(
			makeDeps({
				lookupCastByHashOrWarpcastUrl: async () => null as any,
			}),
		);
		await expect(
			wrappa({ action: "like", hashOrUrl: "0xdeadbeef" }),
		).rejects.toThrow("Cast not found");
	});

	test("reply requires text and cast", async () => {
		const wrappa = createWrappa(makeDeps());
		await expect(
			wrappa({ action: "reply", hashOrUrl: "0xdeadbeef" }),
		).rejects.toThrow("Text is required");
	});

	test("attachments are mapped through embedder", async () => {
		let embedCalls = 0;
		const wrappa = createWrappa(
			makeDeps({
				hashOrUrlToEmbed: async () => {
					embedCalls++;
					return { url: "https://example.com" } as any;
				},
				publishCast: async () => new Response(),
			}),
		);
		await wrappa({
			action: "cast",
			text: "hello",
			attachments: ["https://example.com/a", "https://example.com/b"],
		});
		expect(embedCalls).toBe(2);
	});
});
