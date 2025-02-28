#!/bin/bash

# RPC_URL="http://localhost:80/rpc"
RPC_URL="http://replica.localhost:80/rpc"
RECIPIENT="0x3fAB184622Dc19b6109349B94811493BF2a45362"
SENDER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Get chain ID
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")
echo "Chain ID: $CHAIN_ID"

# Get initial balance
BALANCE=$(cast balance "$RECIPIENT" --rpc-url "$RPC_URL")
echo "Initial balance: $BALANCE"

# Send transaction
cast send \
  --from "$SENDER" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC_URL" \
  --value 1ether \
  "$RECIPIENT"

# Wait until balance > 0
while true; do
  NEW_BALANCE=$(cast balance "$RECIPIENT" --rpc-url "$RPC_URL")
  echo "Current balance: $NEW_BALANCE"
  if [[ "$NEW_BALANCE" != "0" ]]; then
    echo "Balance updated!"
    break
  fi
  sleep 5
done