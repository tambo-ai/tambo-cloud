#!/bin/bash

# Build Tambo Docker Containers
# This script builds all containers for the Tambo application

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔨 Building Tambo Docker Containers...${NC}"
echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Build all containers with BuildKit
echo -e "${BLUE}🚀 Building containers with BuildKit...${NC}"

# Check if running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    echo -e "${YELLOW}📦 Using GitHub Actions cache for builds...${NC}"
    DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose --env-file docker.env build \
        --build-arg BUILDKIT_CACHE_FROM=type=gha \
        --build-arg BUILDKIT_CACHE_TO=type=gha,mode=max
else
    echo -e "${YELLOW}📦 Using default Docker caching...${NC}"
    DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose --env-file docker.env build
fi

echo -e "${GREEN}✅ Build completed!${NC}"
echo -e "${YELLOW}💡 To start the containers: ./scripts/tambo-start.sh${NC}" 