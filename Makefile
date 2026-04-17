.PHONY: setup build inspect serve-stdio serve-http docker-up docker-down clean test

# Quick setup: install dependencies and initialize .env
setup:
	npm install
	@if [ ! -f .env ]; then cp .env.example .env; echo "✅ Created .env file. Please add your NANSEN_API_KEY."; else echo "✅ .env file already exists."; fi

# Compile TypeScript and prepare build Directory
build:
	npm run build

# Format and Lint
lint:
	npm run lint

# Run Unit Tests
test:
	npm test

# Run the MCP Inspector for local testing (GUI)
inspect: build
	npm run inspect

# Run the server in stdio mode (used by Claude Desktop / Cursor)
serve-stdio: build
	npm run serve:stdio

# Run the server in HTTP mode (used for remote agents)
serve-http: build
	npm run serve:http

# ---------------------------------------------------------
# Docker Commands
# ---------------------------------------------------------

# Spin up via Docker Compose in the background
docker-up:
	docker compose up --build -d

# Spin down Docker containers
docker-down:
	docker compose down

# View live Docker logs
docker-logs:
	docker compose logs -f

# Clean up build artifacts and node_modules
clean:
	rm -rf build
	rm -rf node_modules
