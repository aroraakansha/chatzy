#!/bin/bash

# Google OAuth2 Setup Script for Chatzy Backend
# This script helps you set up and run the Spring Boot application with proper OAuth2 configuration

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Chatzy Backend - OAuth2 Setup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."

    if ! command -v java &> /dev/null; then
        echo -e "${RED}❌ Java is not installed${NC}"
        exit 1
    fi

    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}❌ Maven is not installed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Prompt user for OAuth2 credentials
get_oauth_credentials() {
    echo ""
    echo -e "${YELLOW}Google OAuth2 Configuration${NC}"
    echo "Get your credentials from: https://console.cloud.google.com/apis/credentials"
    echo ""

    read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
    read -sp "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
    echo ""

    if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        echo -e "${RED}❌ Client ID or Secret cannot be empty${NC}"
        exit 1
    fi
}

# Prompt user for database credentials
get_db_credentials() {
    echo ""
    echo -e "${YELLOW}Database Configuration${NC}"
    echo "Make sure PostgreSQL is running on localhost:5432"
    echo ""

    read -p "Database name (default: chatzy): " DB_NAME
    DB_NAME=${DB_NAME:-chatzy}

    read -p "Database user (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "Database password: " DB_PASSWORD
    echo ""

    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ Database password cannot be empty${NC}"
        exit 1
    fi
}

# Set environment variables and run
run_application() {
    echo ""
    echo -e "${YELLOW}Starting Spring Boot application...${NC}"
    echo ""

    export GOOGLE_CLIENT_ID
    export GOOGLE_CLIENT_SECRET
    export DB_NAME
    export DB_USER
    export DB_PASSWORD
    export Jwt_Token="lkadsjf;i34jfksdajfk89539843949u589up9ewr90845"

    cd "$(dirname "$0")" || exit 1

    echo -e "${GREEN}Environment variables set:${NC}"
    echo "  GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:10}****"
    echo "  DB_NAME: $DB_NAME"
    echo "  DB_USER: $DB_USER"
    echo ""

    mvn clean compile

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
        echo ""
        echo -e "${YELLOW}Starting application...${NC}"
        mvn spring-boot:run
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Main execution
check_requirements
get_oauth_credentials
get_db_credentials
run_application

