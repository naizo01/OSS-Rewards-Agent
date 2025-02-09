#!/bin/bash

# .envファイルを読み込む
export $(grep -v '^#' .env | xargs)

# APIエンドポイントと認証情報を設定
API_URL=${PRIVY_API_URL}
APP_ID=${PRIVY_APP_ID}
APP_SECRET=${PRIVY_APP_SECRET}
AUTH_SIGNATURE=${AUTHORIZATION_SIGNATURE}
POLICY_ID=${POLICY_ID}

# cURLコマンドでPOSTリクエストを送信
response=$(curl -s -X POST "https://api.privy.io/v1/wallets" \
  -u "$APP_ID:$APP_SECRET" \
  -H "privy-app-id: $APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "chain_type": "ethereum",
    "policy_ids": ["'"$POLICY_ID"'"]
  }')

# レスポンスを表示
echo "Response from API:"
echo "$response"