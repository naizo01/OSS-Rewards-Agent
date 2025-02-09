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
response=$(curl -s -X POST "https://api.privy.io/v1/policies" \
  -u "$NEXT_PUBLIC_PRIVY_APP_ID:$PRIVY_SECRET_ID" \
  -H "privy-app-id: $NEXT_PUBLIC_PRIVY_APP_ID" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "name": "Allow Signing Only",
    "chain_type": "ethereum",
    "method_rules": [{
      "method": "eth_signTransaction",
      "rules": [{
        "name": "Allow only signing",
        "conditions": [],
        "action": "ALLOW"
      }]
    }],
    "default_action": "DENY"
  }')

# レスポンスを表示
echo "Response from API:"
echo "$response"

# {"chain_type":"ethereum","method_rules":[{"rules":[{"name":"Allow only signing","action":"ALLOW","conditions":[]}],"method":"eth_signTransaction"}],"default_action":"DENY","id":"nq99jm0ugzw6h1e0msf1c723","name":"Allow Signing Only","version":"1.0","created_at":1739101535074}

# sh script/policies.sh
