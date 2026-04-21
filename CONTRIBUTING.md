## Contributing

This doc is for **repo internals** and **developer workflow**. The user-facing CLI overview lives in `README.md`.

### Tooling

- **Runtime**: Bun + TypeScript (`type: "module"` ESM)
- **Testing**: `bun test`
- **Typecheck + tests**: `bun run check`

### Repo layout

```
hyper                # Bun CLI entrypoint (`./hyper --help`)
scripts/scratch.ts    # ad-hoc entry; imports ../src/*
src/env.ts            # dotenvx config(); FID, PK, NEYNAR_API_KEY
src/hubs.ts           # Hub registry + getHub()
src/hypersnap.ts      # hub HTTP client; Farcaster message builders
src/neynar.ts         # api.neynar.com + LMDB cache
src/rpc.ts            # RPC racer client (e.g., ETH + USDC balances on Base)
src/wrappa.ts         # high-level cast / like / reply orchestration
src/utils.ts          # small utilities used by CLI scripts
package.json          # "start" -> bun run scripts/scratch.ts
.env.example          # placeholder shape for dotenvx-encrypted vars
```

### Environment (process.env)

`src/env.ts` calls `config()` from `@dotenvx/dotenvx` at import time; import `src/env` (or any module that imports it) before relying on `process.env.*`.

| name | required_when | semantics |
|------|----------------|-----------|
| `FID` | identity | number string; default `0` if unset |
| `PK` | hub signing | hex private key; with or without `0x` prefix |
| `NEYNAR_API_KEY` | `src/neynar.ts` calls | sent as `x-api-key` to Neynar |
| dotenvx | optional | `DOTENV_PUBLIC_KEY` in `.env`; private key material in `.env.keys` (must stay untracked) |

Template: `.env.example`.

### External endpoints (hardcoded unless edited)

- Hub HTTP: from `getHub("quilibrium")` in `src/hypersnap.ts` → `https://haatz.quilibrium.com` (ssl true). Other hub records in `src/hubs.ts` (`neynar`, `borodutch`).
- Hub write path: `POST /v1/submitMessage` body = `Buffer` protobuf bytes, header `Content-Type: application/octet-stream`, itty-fetcher `encode: false`.
- Neynar: `src/neynar.ts` `base: "https://api.neynar.com"`, header `accept: application/json`, `x-api-key: NEYNAR_API_KEY`.
- RPC: `src/rpc.ts` `base: "https://evm.stupidtech.net/v1"` (rpc-racer), defaults to Base (chain 8453).

### Repo hygiene constraints

- Never commit `.env.keys`. `.env` is ignored by default in this repo
- Treat `scripts/scratch.ts` as non-library scratch; library surface is `src/*`

### Commands

```bash
bun install
bun start    # bun run scripts/scratch.ts
bun run check
./hyper --help
```

MIT License: `LICENSE`.
