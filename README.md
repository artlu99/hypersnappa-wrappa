# hypersnappa-wrappa

Purpose: Bun+TS CLI workspace for Farcaster hub writes (protobuf `Message` via `@farcaster/core` + HTTPS `submitMessage`) and Neynar HTTPS reads with LMDB-backed GET caching. Not npm-published.

## Canonical tree

```
scripts/scratch.ts    # ad-hoc entry; imports ../src/*
src/env.ts            # dotenvx config(); FID, PK, NEYNAR_API_KEY
src/hubs.ts           # Hub registry + getHub()
src/hypersnap.ts      # hub HTTP client; Farcaster message builders
src/neynar.ts         # api.neynar.com + LMDB cache
src/wrappa.ts         # high-level cast / like / reply orchestration
package.json          # "start" -> bun run scripts/scratch.ts
.env.example          # placeholder shape for dotenvx-encrypted vars
```

## Runtime / toolchain

- `type: "module"` ESM.
- Execute with Bun: `bun start` or `bun run scripts/scratch.ts`.
- `src/env.ts` calls `config()` from `@dotenvx/dotenvx` at import time; import `src/env` (or any module that imports it) before relying on `process.env.*` for `FID`/`PK`/`NEYNAR_API_KEY`.

## Environment (process.env)

| name | required_when | semantics |
|------|----------------|-----------|
| `FID` | identity | number string; default `0` if unset |
| `PK` | hub signing | hex private key; with or without `0x` prefix |
| `NEYNAR_API_KEY` | `src/neynar.ts` calls | sent as `x-api-key` to Neynar |
| dotenvx | optional | `DOTENV_PUBLIC_KEY` in `.env`; private key material in `.env.keys` (must stay untracked) |

Template: `.env.example`.

## External endpoints (hardcoded unless edited)

- Hub HTTP: from `getHub("quilibrium")` in `src/hypersnap.ts` → `https://haatz.quilibrium.com` (ssl true). Other hub records in `src/hubs.ts` (`neynar`, `borodutch`).
- Hub write path: `POST /v1/submitMessage` body = `Buffer` protobuf bytes, header `Content-Type: application/octet-stream`, itty-fetcher `encode: false`.
- Neynar: `src/neynar.ts` `base: "https://api.neynar.com"`, header `accept: application/json`, `x-api-key: NEYNAR_API_KEY`.

## Repo hygiene constraints

- Never commit `.env.keys`. `.env` is ignored by default in this repo
- Treat `scripts/scratch.ts` as non-library scratch; library surface is `src/*`

## Commands

```bash
bun install
bun start    # bun run scripts/scratch.ts
bun run check
```

MIT License: `LICENSE`.
