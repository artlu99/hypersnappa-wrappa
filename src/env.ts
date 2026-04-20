import { config } from "@dotenvx/dotenvx";

config();
export const FID = Number(process.env.FID ?? 0);
export const PK: `0x${string}` = `0x${(process.env.PK ?? "").replace(/^0x/, "")}`;
export const NEYNAR_API_KEY: string = process.env.NEYNAR_API_KEY ?? "";
