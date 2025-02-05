## poetry 設定

### インストール

```
curl -sSL https://install.python-poetry.org | python3 -
```

### poetry の環境変数パス設定

```
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc  # bash の場合
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # zsh の場合
```

### poetry バージョン確認

```
poetry --version
```

### ライブラリインストール

```
poetry install
```

## pyenv の設定 （python のバージョン管理ツール）

- backend ディレクトリ配下にて pyenv 3.12.6 を実行（3.10 以上推奨）

```
pyenv install 3.12.6
pyenv local 3.12.6
```

## python 実行環境 (venv) の設定

### 仮想環境構築&起動

```
python3.12 -m venv ai_hackathon
source ai_hackathon/bin/activate
```

### 終了

```
deactivate
```

## 環境変数

- ひとまず.env に対応したものは後ほどあげます。ターミナルで以下のコマンドをお願いします。

```
export CDP_API_KEY_NAME="organizations/ee..."
export CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\...\n-----END EC PRIVATE KEY-----\n"
export OPENAI_API_KEY="sk-.."
export NETWORK_ID="base-sepolia"
```

## サーバー起動 プロジェクト root（すなわち agent-private 直下）にて以下を実行

```
python -m backend.app
```

上記で動作しない場合、backend ディレクトリに遷移後、下記コマンド実行で動作する可能性がある。

```
poetry run python -m app
```

## リクエストとレスポンス確認

- リクエスト

```
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "NFTを発行したい"}'
```

- レスポンス

```
{"response": "まず、NFTの発行に必要な情報を教えてください。\n\n1. NFTコレクションの名前（例: \"Helpful Hippos\"）\n2. NFTコレクションのシンボル（例: \"HIPPO\"）\n3. トークンメタデータのベースURI（例: \"https://www.helpfulhippos.xyz/metadata/\"）\n\nこれらの情報を教えていただければ、NFTを発行します。"}%
```
