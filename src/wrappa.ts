import { type Embed, ReactionType } from "@farcaster/core";
import { castReact, publishCast } from "./hypersnap";
import {
	isCastUrl,
	lookupCastByHashOrWarpcastUrl,
	lookupChannelByIdOrParentUrl,
} from "./neynar";
import { hexToBytes } from "./utils";

export type WrappaInput = {
	hashOrUrl?: string;
	action: "cast" | "like" | "reply" | "recast" | "like+reply" | "like+recast";
	text?: string;
	attachments?: string[];
	channelId?: string;
	mentions?: number[];
	mentionsPositions?: number[];
};

export type WrappaDeps = {
	castReact: typeof castReact;
	publishCast: typeof publishCast;
	lookupCastByHashOrWarpcastUrl: typeof lookupCastByHashOrWarpcastUrl;
	lookupChannelByIdOrParentUrl: typeof lookupChannelByIdOrParentUrl;
	hashOrUrlToEmbed: (hashOrUrl: string) => Promise<Embed>;
};

const defaultHashOrUrlToEmbed = async (hashOrUrl: string): Promise<Embed> => {
	if (hashOrUrl.startsWith("0x") || isCastUrl(hashOrUrl)) {
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

		const cast = hashOrUrl
			? await deps.lookupCastByHashOrWarpcastUrl(hashOrUrl)
			: null;

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

		if (
			action === "like" ||
			action === "like+reply" ||
			action === "like+recast"
		) {
			if (!cast) {
				throw new Error(`Cast not found: ${hashOrUrl}`);
			}
			console.log(`Liking cast ${cast.cast.hash}`);
			await deps.castReact(
				{
					fid: cast.cast.author.fid,
					hash: `0x${cast.cast.hash.replace("0x", "")}`,
				},
				ReactionType.LIKE,
			);
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

		if (action === "recast" || action === "like+recast") {
			if (!cast) {
				throw new Error("Cast not found");
			}
			console.log(`Recasting ${cast.cast.hash}`);
			await deps.castReact(
				{
					fid: cast.cast.author.fid,
					hash: `0x${cast.cast.hash.replace("0x", "")}`,
				},
				ReactionType.RECAST,
			);
		}
	};
};

export const wrappa = createWrappa({
	castReact: castReact,
	publishCast,
	lookupCastByHashOrWarpcastUrl,
	lookupChannelByIdOrParentUrl,
	hashOrUrlToEmbed: defaultHashOrUrlToEmbed,
});
