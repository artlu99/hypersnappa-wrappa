import { FARCASTER_EPOCH } from "@farcaster/core";
import invariant from "tiny-invariant";

export const getTimestamp = (timestamp: number): string => {
	return new Date(timestamp).toISOString();
};

export const getTimestampFromFarcasterTimestamp = (
	farcasterTimestamp: number,
): number => {
	return farcasterTimestamp * 1000 + FARCASTER_EPOCH;
};


interface Hub {
	shortname: string;
	url: string;
	ssl: boolean;
	fid: number;
	contact: string;
	write: boolean;
}

const knownHubs: Hub[] = [
	{
		shortname: "quilibrium",
		url: "haatz.quilibrium.com",
		ssl: true,
		fid: 1325,
		write: true,
		contact: "https://neynar.com",
	},
	{
		shortname: "neynar",
		url: "hub-api.neynar.com",
		ssl: true,
		fid: 6546,
		write: true,
		contact: "https://neynar.com",
	},
	{
		shortname: "borodutch",
		url: "34.172.154.21:2283",
		ssl: false,
		fid: 1356,
		write: true,
		contact: "https://github.com/backmeupplz",
	},
];

type KnownHubs = "quilibrium" | "neynar" | "borodutch";

export const getHub = (shortname: KnownHubs): Hub => {
	const hub = knownHubs.find((hub) => hub.shortname === shortname);
	invariant(hub, `Hub ${shortname} not found`);

	return hub;
};
