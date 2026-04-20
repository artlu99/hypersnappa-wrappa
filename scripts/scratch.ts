import { sort, unique } from "radash";
import { FID } from "../src/env";
import { getLikesByFid } from "../src/hypersnap";
import { lookupChannelByIdOrParentUrl } from "../src/neynar";
import { wrappa } from "../src/wrappa";

const channel = await lookupChannelByIdOrParentUrl("farcaster");
console.log(channel);

const res = await getLikesByFid(FID);
// const sortedLikedUniqueFids =
sort(unique(res.map((r) => r?.targetFid)), (i) => i ?? 0);

const doIt = async () => {
	await wrappa({
		action: "cast",
		channelId: "dev",
		text: "for caching API calls, I really like a barbell approach (skip the middle): lmdb -> redis -> momento",
	});
};

false && doIt();
