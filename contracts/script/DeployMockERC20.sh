# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
else
  echo ".env file not found."
  exit 1
fi

# Execute the forge script command
forge script script/DeployMockERC20.s.sol:DeployMockERC20 \
  --rpc-url $RPC_URL \
  --chain-id $CHAIN_ID \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verifier-url $SCAN_URL \
  --verify \
  --etherscan-api-key $SCAN_API_KEY \
  -vvvv
  # --priority-gas-price 100000000 \ 