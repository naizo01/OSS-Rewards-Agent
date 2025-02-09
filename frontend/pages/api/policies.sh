#!/bin/bash

# .envファイルを読み込む
export $(grep -v '^#' .env | xargs)

# APIエンドポイントと認証情報を設定
API_URL=${PRIVY_API_URL}
APP_ID=${PRIVY_APP_ID}
APP_SECRET=${PRIVY_APP_SECRET}

# cURLコマンドでPOSTリクエストを送信
response=$(curl -s -X POST "https://api.privy.io/v1/policies" \
  -u "$APP_ID:$APP_SECRET" \
  -H "privy-app-id: $APP_ID" \
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