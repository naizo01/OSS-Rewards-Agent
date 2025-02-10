## POETRY SETTINGS

#### install

`````
curl -sSL https://install.python-poetry.org | python3 -
```

### set environment variable paths for poetry

```
echo 'export PATH=“$HOME/.local/bin:$PATH”' >> ~/.bashrc # For bash
echo 'export PATH=“$HOME/.local/bin:$PATH”' >> ~/.zshrc # for zsh
```

### poetry version check (python 3.12 or higher recommended to run poetry)

```
poetry --version
```

### library installation

```
poetry install
```


## Environment Variables
```` environment variables
## Coinbase agentkit information
CDP_API_KEY_NAME=
CDP_API_KEY_PRIVATE_KEY=
NETWORK_ID=
MNEMONIC_PHRASE=

# Google API Key
GOOGLE_API_KEY=

# GitHub Repository information
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
LABEL_NAME=

CONTRACT_ADDRESS=
GITHUB_API_URL="https://api.github.com”
```

## Start the server Run the following directly under root/backend.
```
poetry run python -m app
```

## Check request and response

- Request: ```` -m

```
curl -X POST http://localhost:5001/api/chat \
  -H “Content-Type: application/json” \}
  -d '{“message”: “I want to issue an NFT”}'
```

- Response.

```
{“response”: “First, what information do you need to issue an NFT? \The name of the NFT collection (e.g.\“Helpful Hippos\”)}n2. the symbol of the NFT collection (e.g.\“HIPPO\”)}n3. the base URI of the token metadata (e.g.\"https://www.helpfulhippos.xyz/ metadata/\“\”/metadata/\“}\nGive us this information and we will issue an NFT.”} %
```

## API Usage

The application exposes a chat endpoint that accepts natural language commands for blockchain interactions:.

```bash
curl -X POST http://localhost:5001/api/chat \
  -H “Content-Type: application/json” \}
  -d '{“input”: “Please tell me the wallet address that the agent will operate.”, “conversation_id”: 0}'
```

````bash
curl -X POST http://localhost:5000/api/chat \
  -H “Content-Type: application/json” \}
  -d '{“input”: “What should I do?”, “conversation_id”: 0}'
```
````bash
curl -X POST http://localhost:5001/api/chat \
  -H “Content-Type: application/json” \}
  -d '{“input”: “I want to execute the lockReward function. The repository is https://github.com/naizo01/agentic. The issue is 1. The amount is 1000 The amount is 1000 tokens.”, ‘conversation_id’: 0}'
````bash
````bash
curl -X POST http://localhost:5001/api/chat \}
  -H “Content-Type: application/json” \}
  -d '{“input”: “Execute the transaction”, “conversation_id”: 0}'
```


Retrieve a list of rewards by the agent: ````bash

```bash
curl http://localhost:5001/rewards
```

Translated with DeepL.com (free version)
`````
