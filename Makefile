# Export variables from .env to be available in sub-shells
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

serve:
	@echo "Starting API server..."
	@go run main.go &

.PHONY: frontend
frontend:
	@echo "Starting frontend development server..."
	@cd clarion-frontend && npm run dev

.PHONY: dev
dev:
	@make serve
	@make frontend

.PHONY: build
build:
	@echo "Building backend..."
	@go build -o clarion main.go
	@echo "Building frontend..."
	@cd clarion-frontend && npm run build
