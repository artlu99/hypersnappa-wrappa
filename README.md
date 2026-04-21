# hypersnappa-wrappa

Bun+TS headless CLI for Farcaster

## CLI: `hyper`

List commands `./hyper help`:

- `ls <user>`: List most recent casts+replies
- `url <url>`: Resolve a cast URL to a full hash
- `like <url>`: Like a cast
- `cast [message]`: Cast a message (options: `--channel`, repeatable `--embed`; message can be read from STDIN)
- `boost <url>`: Boost a cast by liking + recasting
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

### `hyper cast` Example

- **Message input**: pass `[message]` as an argument, or pipe it via **STDIN** (supports multi-line).
- **Embeds**: repeat `--embed <url>` (0–2 embeds supported).

```bash
# cast a message
./hyper cast "hello world"

# multi-line via STDIN
cat draft.txt | ./hyper cast

# 1-2 embeds (repeat the flag)
./hyper cast "with embeds" --embed "https://example.com" --embed "https://example.org"
```

## Setup (end users)

```bash
bun install
bun check
chmod u+x ./hyper
./hyper --help
```

To use commands that sign/write to Farcaster (*e.g.*, `cast`, `reply`, `like`, `recast`, `delete`) you need:

- `FID`: your Farcaster fid (number)
- `PK`: your Farcaster signer private key (hex; with or without `0x`)

To use commands that hit Neynar reads (*e.g.*, `frens`) you may also with to provide:

- `NEYNAR_API_KEY`

Start from `.env.example` and make sure the variables are present in your environment before running `./hyper`.

Ask your LLM if this is safe before running.

## Contributing / setup

See `CONTRIBUTING.md`

MIT License: `LICENSE`.