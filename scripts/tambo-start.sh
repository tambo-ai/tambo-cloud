#!/bin/bash

# Start Tambo Docker Stack
# This script starts the Tambo application with Supabase services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Tambo Docker Stack...${NC}"

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

# Create network if it doesn't exist
echo -e "${BLUE}🔗 Creating Docker network...${NC}"
docker network create tambo_network 2>/dev/null || true

# Check if Supabase files exist
if [ ! -f "docker-compose.supabase.yml" ]; then
    echo -e "${RED}❌ docker-compose.supabase.yml not found!${NC}"
    exit 1
fi

# Pull latest images
echo -e "${YELLOW}📦 Pulling latest images...${NC}"
docker compose --env-file docker.env pull

# Start Supabase services first
echo -e "${BLUE}🔧 Starting Supabase services...${NC}"
docker compose --env-file docker.env -f docker-compose.supabase.yml up -d

# Wait for Supabase to be healthy
echo -e "${YELLOW}⏳ Waiting for Supabase services to be healthy...${NC}"
sleep 10

# Check if Supabase services are healthy
SUPABASE_HEALTH=$(docker compose --env-file docker.env -f docker-compose.supabase.yml ps --format json | jq -r '.[] | select(.Service == "supabase-db") | .Health')
if [ "$SUPABASE_HEALTH" != "healthy" ]; then
    echo -e "${YELLOW}⏳ Waiting for Supabase database to be healthy...${NC}"
    sleep 20
fi

# Start Tambo services
echo -e "${BLUE}🎯 Starting Tambo services...${NC}"
docker compose --env-file docker.env up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check service status
echo -e "${GREEN}✅ Checking service status...${NC}"
docker compose --env-file docker.env ps

echo -e "${GREEN}🎉 Tambo Docker Stack started successfully!${NC}"
echo -e "${BLUE}📋 Available services:${NC}"
echo -e "  • Tambo Web: http://localhost:3000"
echo -e "  • Tambo API: http://localhost:3001"
echo -e "  • Supabase Studio: http://localhost:8000"
echo -e "  • Supabase Database: localhost:5432"
echo -e ""
echo -e "${YELLOW}💡 To stop the stack: ./scripts/tambo-stop.sh${NC}"
echo -e "${YELLOW}💡 To view logs: ./scripts/tambo-logs.sh${NC}" 