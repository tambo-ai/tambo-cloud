#!/bin/bash

# Stop Tambo Docker Stack
# This script stops the Tambo application and Supabase services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Tambo Docker Stack...${NC}"

# Stop Tambo services first
echo -e "${BLUE}🎯 Stopping Tambo services...${NC}"
docker compose --env-file docker.env down || true

# Stop Supabase services
echo -e "${BLUE}🔧 Stopping Supabase services...${NC}"
docker compose --env-file docker.env -f docker-compose.supabase.yml down || true

# Remove network (only if no other containers are using it)
echo -e "${BLUE}🔗 Cleaning up network...${NC}"
docker network rm tambo_network 2>/dev/null || true

echo -e "${GREEN}✅ Tambo Docker Stack stopped successfully!${NC}"
echo -e "${YELLOW}💡 To start the stack again: ./scripts/tambo-start.sh${NC}" 