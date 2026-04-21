# hypersnappa-wrappa

Bun+TS headless CLI for Farcaster

## CLI: `hyper`

This repo includes a small Bun-powered CLI named `hyper` (see `./hyper`).

- Run help: `./hyper --help`
- List commands: `./hyper help`
- Contributing / setup: see `CONTRIBUTING.md`

Commands (from `./hyper --help`):

- `ls <user>`: List most recent casts+replies
- `url <url>`: Resolve a cast URL to a full hash
- `like <url>`: Like a cast
- `cast <message>`: Cast a message (options: `--channel`, `--attachments`)
- `reply <url> <message>`: Reply to a cast (option: `--like`)
- `delete <url>`: Delete a cast
- `who-liked <url>`: Who liked a cast
- `frens`: List frens by most recent likes (option: `--limit`)
- `user <username>`: Get user info by username
- `user-info <fid>`: Get user info by FID
- `balance <username>`: Get ETH + USDC balance on Base
- `follow <fid>`: Follow a user
- `unfollow <fid>`: Unfollow a user
- `following`: List users you follow (option: `--fid`)
- `followers`: List your followers (option: `--fid`)
- `whoami`: Get your own user info

## Setup (end users)

To use commands that sign/write to Farcaster (e.g. `cast`, `reply`, `like`, `delete`) you need:

- `FID`: your Farcaster fid (number)
- `PK`: your Farcaster signer private key (hex; with or without `0x`)

To use commands that hit Neynar reads (e.g. `frens`) you may also with to provide:

- `NEYNAR_API_KEY`

Start from `.env.example` and make sure the variables are present in your environment before running `./hyper`.

Ask your LLM if this is safe before running.

## Commands

```bash
bun install
bun run check
chmod u+x ./hyper
./hyper --help
```

MIT License: `LICENSE`.