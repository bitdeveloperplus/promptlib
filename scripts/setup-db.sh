#!/bin/bash

# Setup script for PostgreSQL database with Docker

echo "🚀 Setting up PostgreSQL database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is healthy
if docker-compose ps | grep -q "Up"; then
    echo "✅ PostgreSQL container 'prompt-lib' is running!"
    echo ""
    echo "📊 Database connection details:"
    echo "   Container: prompt-lib"
    echo "   Host: localhost"
    echo "   Port: 3690"
    echo "   Database: prompt_manage"
    echo "   User: postgres"
    echo "   Password: postgres"
    echo ""
    echo "🔗 Connection URL:"
    echo "   postgresql://postgres:postgres@localhost:3690/prompt_manage"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env (if not already done)"
    echo "2. Run: npm run db:generate"
    echo "3. Run: npx prisma migrate dev"
else
    echo "❌ Failed to start PostgreSQL. Check logs with: docker-compose logs postgres"
    exit 1
fi

