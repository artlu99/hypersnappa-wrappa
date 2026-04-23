#!/bin/env bash

set -euo pipefail

# take a url as an argument, e.g., https://farcaster.xyz/olystuart/0xdd6f03ef
url=$1

# extract the username and short hash into variables using one regex
[[ "$url" =~ ^https://farcaster\.xyz/([^/]+)/([^/]+)$ ]] && username="${BASH_REMATCH[1]}" short_hash="${BASH_REMATCH[2]}"

# call the Farcaster client internal API and print the casts in a table
curl -s "https://farcaster.xyz/~api/v2/user-thread-casts?castHashPrefix=$short_hash&username=$username&limit=15" \
  | jq -r '.result.casts[] | [(.hash[0:10]), .author.username, (.text[0:130])] | @tsv' \
  | column -t -s $'\t'
