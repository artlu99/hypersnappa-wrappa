import {
	CastType,
	type Embed,
	FarcasterNetwork,
	type HubError,
	isHubError,
	Message,
	type MessagesResponse,
	makeCastAdd,
	makeCastRemove,
	makeLinkAdd,
	makeLinkRemove,
	makeReactionAdd,
	NobleEd25519Signer,
	ReactionType,
	type UserNameProof,
} from "@farcaster/core";
import { LinkType } from "@neynar/nodejs-sdk/build/hub-api/models";
import { fetcher } from "itty-fetcher";
import { sift, sort, unique } from "radash";
import { FID, PK } from "./env";
import { getHub } from "./hubs";
import { hexToBytes } from "./utils";

const hub = getHub("quilibrium");

const client = fetcher({
	base: `${hub.ssl ? "https" : "http"}://${hub.url}`,
	headers: { Accept: "application/json" },
});

export const HUB_POST_CONFIG = {
	headers: { "Content-Type": "application/octet-stream" },
	encode: false as const,
};

export function castTypeForText(text: string): CastType {
	const lengthInBytes = new TextEncoder().encode(text).length;

	if (lengthInBytes > 320) {
		return CastType.LONG_CAST;
	}
	return CastType.CAST;
}

export async function publishCast(
	text: string,
	parentCast?: { fid: number; hash: `0x${string}` },
	embeds?: Embed[],
	parentUrl?: string,
	mentions: number[] = [],
	mentionsPositions: number[] = [],
) {
	const signer = new NobleEd25519Signer(hexToBytes(PK));
	const dataOptions = {
		fid: FID,
		network: FarcasterNetwork.MAINNET,
	};
	const parentCastId = parentCast
		? {
				fid: parentCast.fid,
				hash: hexToBytes(parentCast.hash),
			}
		: undefined;
	const type = castTypeForText(text);
	console.log("Attempting to publish cast using @farcaster/core...");
	const result = await makeCastAdd(
		{
			text,
			parentCastId,
			embedsDeprecated: [],
			parentUrl,
			mentions: mentions ?? [],
			mentionsPositions: mentionsPositions ?? [],
			embeds: embeds ?? [],
			type,
		},
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("sending via Haatz HTTPS Hypersnap API...");
	try {
		const messageBytes = Buffer.from(Message.encode(result.value).finish());
		const response = await client.post<Buffer, Response>(
			"/v1/submitMessage",
			messageBytes,
			HUB_POST_CONFIG,
		);
		console.log("Cast published successfully");
		return response;
	} catch (e) {
		console.error("Error publishing cast:", e);
		throw e;
	}
}

export async function castReact(
	targetCast: {
		fid: number;
		hash: `0x${string}`;
	},
	reactionType: ReactionType = ReactionType.LIKE,
) {
	const signer = new NobleEd25519Signer(hexToBytes(PK));

	console.log(
		`Attempting to ${reactionType === ReactionType.LIKE ? "like" : "recast"} cast using @farcaster/core...`,
	);
	const dataOptions = {
		fid: FID,
		network: FarcasterNetwork.MAINNET,
	};
	const result = await makeReactionAdd(
		{
			targetCastId: {
				fid: targetCast.fid,
				hash: hexToBytes(targetCast.hash),
			},
			type: reactionType,
		},
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("sending via Haatz HTTPS Hypersnap API...");
	try {
		const messageBytes = Buffer.from(Message.encode(result.value).finish());
		const response = await client.post<Buffer, Response>(
			"/v1/submitMessage",
			messageBytes,
			HUB_POST_CONFIG,
		);
		console.log("Cast liked successfully");
		return response;
	} catch (e) {
		console.error("Error liking cast:", e);
		throw e;
	}
}

export async function follow(targetFid: number) {
	const signer = new NobleEd25519Signer(hexToBytes(PK));

	console.log(`Attempting to follow ${targetFid} using @farcaster/core...`);
	const dataOptions = {
		fid: FID,
		network: FarcasterNetwork.MAINNET,
	};
	const result = await makeLinkAdd(
		{
			targetFid,
			type: LinkType.Follow,
		},
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("sending via Haatz HTTPS Hypersnap API...");
	try {
		const messageBytes = Buffer.from(Message.encode(result.value).finish());
		const response = await client.post<Buffer, Response>(
			"/v1/submitMessage",
			messageBytes,
			HUB_POST_CONFIG,
		);
		console.log(`Followed ${targetFid} successfully`);
		return response;
	} catch (e) {
		console.error("Error following:", e);
		throw e;
	}
}

export async function unfollow(targetFid: number) {
	const signer = new NobleEd25519Signer(hexToBytes(PK));

	console.log(`Attempting to unfollow ${targetFid} using @farcaster/core...`);
	const dataOptions = {
		fid: FID,
		network: FarcasterNetwork.MAINNET,
	};
	const result = await makeLinkRemove(
		{
			targetFid,
			type: LinkType.Follow,
		},
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("sending via Haatz HTTPS Hypersnap API...");
	try {
		const messageBytes = Buffer.from(Message.encode(result.value).finish());
		const response = await client.post<Buffer, Response>(
			"/v1/submitMessage",
			messageBytes,
			HUB_POST_CONFIG,
		);
		console.log(`Unfollowed ${targetFid} successfully`);
		return response;
	} catch (e) {
		console.error("Error unfollowing:", e);
		throw e;
	}
}

async function _getLinksByFid(fid: number) {
	const response = await client.get<{ messages: Message[] }>(
		`/v1/linksByFid?fid=${fid}&reverse=true`,
	);
	return response.messages.map((r) => r.data?.linkBody);
}

export async function getLinks(fid: number) {
	const links = await _getLinksByFid(fid);
	return sift(links.map((l) => l?.targetFid));
}

export async function getCasts(
	fid: number,
	reverse: boolean = true,
	pageSize: number = 3,
) {
	const response = await client.get<{ messages: Message[] }>(
		`/v1/castsByFid?fid=${fid}&reverse=${reverse}&pageSize=${pageSize}`,
	);
	return sift(
		response.messages.map((r) => {
			const data = r.data;
			if (!data) return null;
			const { castAddBody } = data;
			if (!castAddBody) return null;
			return {
				text: castAddBody.text ?? null,
				hash: r.hash,
				timestamp: r.data?.timestamp ?? null,
			};
		}),
	);
}

export async function deleteCast(hash: `0x${string}`) {
	const signer = new NobleEd25519Signer(hexToBytes(PK));

	const dataOptions = {
		fid: FID,
		network: FarcasterNetwork.MAINNET,
	};
	const result = await makeCastRemove(
		{ targetHash: hexToBytes(hash) },
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("sending via Haatz HTTPS Hypersnap API...");
	try {
		const messageBytes = Buffer.from(Message.encode(result.value).finish());
		const response = await client.post<Buffer, Response>(
			"/v1/submitMessage",
			messageBytes,
			HUB_POST_CONFIG,
		);
		console.log(`Deleted cast ${hash} successfully`);
		return response;
	} catch (e) {
		console.error("Error deleting cast:", e);
		throw e;
	}
}

export async function getLikesByFid(fid: number) {
	const response = await client.get<{ messages: Message[] }>(
		`/v1/reactionsByFid?reaction_type=Like&fid=${fid}&reverse=true&pageSize=999`,
	);

	return sift(
		response.messages.map((r) => {
			const data = r.data;
			if (!data) return null;
			const { reactionBody } = data;
			if (!reactionBody) return null;
			return {
				targetFid: reactionBody.targetCastId?.fid ?? null,
				targetHash: reactionBody.targetCastId?.hash ?? null,
				hash: r.hash,
				timestamp: r.data?.timestamp ?? null,
			};
		}),
	);
}

export async function getFidFromUsername(username: string) {
	const response = await client.get<UserNameProof | HubError>(
		`/v1/userNameProofByName?name=${username}`,
	);
	if (!isHubError(response)) {
		return response.fid;
	}
	return null;
}

export async function getReactionsByCast(
	fid: number,
	hash: `0x${string}`,
): Promise<number[] | null> {
	const response = await client.get<MessagesResponse | HubError>(
		`/v1/reactionsByCast?reactionType=Like&reverse=true&target_fid=${fid}&target_hash=${hash}`,
	);
	if (!isHubError(response)) {
		return unique(
			sift(
				sort(response.messages ?? [], (r) => r.data?.timestamp ?? 0, true).map(
					(r) => r.data?.fid ?? null,
				),
			),
		);
	}
	return null;
}
