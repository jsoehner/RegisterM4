#!/bin/bash

# Generate secure environment keys for RegisterM4

echo "Generating secure environment keys..."

# Generate encryption key (32 bytes = 64 hex chars)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Generate JWT secret (32 bytes = 64 hex chars)
JWT_SECRET=$(openssl rand -hex 32)

# Generate session secret (32 bytes = 64 hex chars)
SESSION_SECRET=$(openssl rand -hex 32)

# Output to stdout for user to copy
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "JWT_SECRET=$JWT_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"

echo ""
echo "Copy these values to your .env file (do not share them!)"
echo ""
echo "To add to .env file:"
echo "  echo 'ENCRYPTION_KEY=$ENCRYPTION_KEY' >> .env"
echo "  echo 'JWT_SECRET=$JWT_SECRET' >> .env"
echo "  echo 'SESSION_SECRET=$SESSION_SECRET' >> .env"