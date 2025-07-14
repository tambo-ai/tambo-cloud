#!/bin/bash

# View Tambo Docker Stack Logs
# This script displays logs from the Tambo application and Supabase services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Tambo Docker Stack Logs${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo -e ""

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [service_name]${NC}"
    echo -e "${YELLOW}Available services:${NC}"
    echo -e "  • web - Tambo Web application"
    echo -e "  • api - Tambo API application"
    echo -e "  • supabase-db - Supabase Database"
    echo -e "  • supabase-auth - Supabase Auth"
    echo -e "  • supabase-rest - Supabase REST API"
    echo -e "  • supabase-realtime - Supabase Realtime"
    echo -e "  • supabase-studio - Supabase Studio"
    echo -e "  • supabase-kong - Supabase Kong Gateway"
    echo -e ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0           # Show all logs"
    echo -e "  $0 web       # Show only web logs"
    echo -e "  $0 api       # Show only api logs"
}

# Check if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

# If service name provided, show logs for that service only
if [ -n "$1" ]; then
    SERVICE_NAME="$1"
    echo -e "${GREEN}📋 Showing logs for: $SERVICE_NAME${NC}"
    
    # Check if it's a Tambo service
    if [ "$SERVICE_NAME" = "web" ] || [ "$SERVICE_NAME" = "api" ]; then
        docker compose --env-file docker.env logs -f "$SERVICE_NAME"
    else
        # Check if it's a Supabase service
        docker compose --env-file docker.env -f docker-compose.supabase.yml logs -f "$SERVICE_NAME"
    fi
else
    # Show all logs
    echo -e "${GREEN}📋 Showing all logs (Tambo + Supabase)${NC}"
    
    # Use docker compose to show logs from both files
    docker compose --env-file docker.env logs -f &
    PID1=$!
    
    docker compose --env-file docker.env -f docker-compose.supabase.yml logs -f &
    PID2=$!
    
    # Wait for both processes
    wait $PID1 $PID2
fi 