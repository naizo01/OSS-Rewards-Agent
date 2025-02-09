#!/bin/bash

# .envファイルを読み込む
if [ -f .env ]; then
  export $(cat .env | xargs)
else
  echo ".envファイルが見つかりません。"
  exit 1
fi

echo "NEXT_PUBLIC_PRIVY_APP_ID: $NEXT_PUBLIC_PRIVY_APP_ID"
echo "PRIVY_SECRET_ID: $PRIVY_SECRET_ID"

# cURLコマンドでPOSTリクエストを送信
response=$(curl -s -X POST "https://api.privy.io/v1/wallets" \
  -u "$NEXT_PUBLIC_PRIVY_APP_ID:$PRIVY_SECRET_ID" \
  -H "privy-app-id: $NEXT_PUBLIC_PRIVY_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "chain_type": "ethereum",
    "policy_ids": ["'"$PRIVY_POLICY_ID"'"]
  }')

# レスポンスを表示
echo "Response from API:"
echo "$response"

# {"id":"f4cj5vhjuxfjogxzbyn4rjl1","address":"0xDbeb794dFc11A282c2670e0D29f68BbcEec12A8e","chain_type":"ethereum","policy_ids":["nq99jm0ugzw6h1e0msf1c723"],"created_at":1739101732488}

# sh script/wallets.sh