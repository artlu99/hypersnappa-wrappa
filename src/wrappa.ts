import type { Embed } from "@farcaster/core";
import { likeCast, publishCast } from "./hypersnap";
import {
	lookupCastByHashOrWarpcastUrl,
	lookupChannelByIdOrParentUrl,
} from "./neynar";
import { hexToBytes } from "./utils";

export type WrappaInput = {
	hashOrUrl?: string;
	action: "cast" | "like" | "reply" | "like+reply";
	text?: string;
	attachments?: string[];
	channelId?: string;
	mentions?: number[];
	mentionsPositions?: number[];
};

export type WrappaDeps = {
	likeCast: typeof likeCast;
	publishCast: typeof publishCast;
	lookupCastByHashOrWarpcastUrl: typeof lookupCastByHashOrWarpcastUrl;
	lookupChannelByIdOrParentUrl: typeof lookupChannelByIdOrParentUrl;
	hashOrUrlToEmbed: (hashOrUrl: string) => Promise<Embed>;
};

const defaultHashOrUrlToEmbed = async (
	hashOrUrl: string,
): Promise<Embed> => {
	if (
		hashOrUrl.startsWith("0x") ||
		(hashOrUrl.startsWith("https://farcaster.xyz/") &&
			!hashOrUrl.startsWith("https://farcaster.xyz/miniapps/"))
	) {
		const cast = await lookupCastByHashOrWarpcastUrl(hashOrUrl);
		if (!cast) {
			throw new Error(`Cast not found: ${hashOrUrl}`);
		}
		return {
			castId: {
				fid: cast.cast.author.fid,
				hash: hexToBytes(`0x${cast.cast.hash.replace("0x", "")}`),
			},
		};
	}
	if (hashOrUrl.startsWith("https://")) {
		return {
			url: hashOrUrl,
		};
	}
	throw new Error("Invalid hash or URL");
};

export const createWrappa = (deps: WrappaDeps) => {
	return async (input: WrappaInput) => {
		const {
			hashOrUrl,
			action,
			text,
			attachments,
			channelId,
			mentions,
			mentionsPositions,
		} = input;

		const cast = hashOrUrl ? await deps.lookupCastByHashOrWarpcastUrl(hashOrUrl) : null;

		const embeds = await Promise.all(
			attachments?.map(deps.hashOrUrlToEmbed) ?? [],
		);

		if (action === "cast") {
			if (!text) {
				throw new Error("Text is required");
			}
			const parentChannelObject = channelId
				? await deps.lookupChannelByIdOrParentUrl(channelId)
				: undefined;
			const parentUrl = parentChannelObject?.channel.parent_url;
			await deps.publishCast(
				text,
				undefined,
				embeds,
				parentUrl,
				mentions,
				mentionsPositions,
			);
		}

		if (action === "like" || action === "like+reply") {
			if (!cast) {
				throw new Error(`Cast not found: ${hashOrUrl}`);
			}
			console.log(`Liking cast ${cast}`);
			await deps.likeCast({
				fid: cast.cast.author.fid,
				hash: `0x${cast.cast.hash.replace("0x", "")}`,
			});
		}

		if (action === "reply" || action === "like+reply") {
			if (!cast) {
				throw new Error("Cast not found");
			}
			if (!text) {
				throw new Error("Text is required");
			}
			await deps.publishCast(
				text,
				{
					fid: cast.cast.author.fid,
					hash: `0x${cast.cast.hash.replace("0x", "")}`,
				},
				embeds,
				undefined,
				mentions,
				mentionsPositions,
			);
		}
	};
};

export const wrappa = createWrappa({
	likeCast,
	publishCast,
	lookupCastByHashOrWarpcastUrl,
	lookupChannelByIdOrParentUrl,
	hashOrUrlToEmbed: defaultHashOrUrlToEmbed,
});
