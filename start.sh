#!/bin/bash
# HEXIS Law CRM — Start Script
echo "🏛️  HEXIS Law Management System"
echo "================================"
echo ""

cd "$(dirname "$0")"

# Check if database needs seeding
if [ ! -f "prisma/hexis.db" ]; then
  echo "📦 Setting up database..."
  DATABASE_URL="file:./hexis.db" npx prisma db push --skip-generate
  DATABASE_URL="file:./hexis.db" npx ts-node --compiler-options '{"module":"CommonJS","skipLibCheck":true}' prisma/seed.ts
fi

echo "🚀 Starting HEXIS on http://localhost:3000"
echo ""
echo "📧 Login: owner@hexis.law / hexis@2024"
echo ""
npm run dev
