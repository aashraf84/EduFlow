#!/bin/bash
# EduFlow ERP - Vercel Environment Variables Setup Script
# Project: eduflowerp.vercel.app
# GitHub: apexflowerp/EduFlow
#
# USAGE:
#   Option 1: Set VERCEL_TOKEN env var before running
#     export VERCEL_TOKEN="your-token-here"
#     bash set-vercel-env.sh
#
#   Option 2: Pass token as argument
#     bash set-vercel-env.sh "your-token-here"
#
#   Option 3: Run vercel login first, then this script
#     vercel login
#     bash set-vercel-env.sh

set -e

TOKEN="${1:-$VERCEL_TOKEN}"
PROJECT_DIR="/home/z/my-project"
COMMON_OPTS="--yes --cwd $PROJECT_DIR"

if [ -n "$TOKEN" ]; then
  COMMON_OPTS="$COMMON_OPTS --token $TOKEN"
fi

# Verify authentication
echo "🔍 Verifying Vercel authentication..."
if [ -n "$TOKEN" ]; then
  vercel whoami --token "$TOKEN" 2>&1 || { echo "❌ Authentication failed. Check your token."; exit 1; }
else
  vercel whoami 2>&1 || { echo "❌ Not authenticated. Run 'vercel login' or provide a token."; exit 1; }
fi

echo ""
echo "📋 Linking project to eduflowerp..."
vercel link --project eduflowerp --yes --cwd "$PROJECT_DIR" ${TOKEN:+--token $TOKEN} 2>&1 || true

echo ""
echo "🔧 Setting environment variables for production..."

# 1. DATABASE_URL
echo "  Setting DATABASE_URL..."
vercel env add DATABASE_URL production --value "postgresql://neondb_owner:npg_3B6CHnzYviut@ep-morning-dust-apbe8qu4-pooler.c-7.us-east-1.aws.neon.tech/eduflow_gia_001?sslmode=require" --force $COMMON_OPTS

# 2. MASTER_DATABASE_URL
echo "  Setting MASTER_DATABASE_URL..."
vercel env add MASTER_DATABASE_URL production --value "postgresql://neondb_owner:npg_3B6CHnzYviut@ep-morning-dust-apbe8qu4-pooler.c-7.us-east-1.aws.neon.tech/eduflow_gia_001?sslmode=require" --force $COMMON_OPTS

# 3. DIRECT_DATABASE_URL
echo "  Setting DIRECT_DATABASE_URL..."
vercel env add DIRECT_DATABASE_URL production --value "postgresql://neondb_owner:npg_3B6CHnzYviut@ep-morning-dust-apbe8qu4.c-7.us-east-1.aws.neon.tech/eduflow_gia_001?sslmode=require" --force $COMMON_OPTS

# 4. TENANT_GIA001_URL
echo "  Setting TENANT_GIA001_URL..."
vercel env add TENANT_GIA001_URL production --value "postgresql://neondb_owner:npg_3B6CHnzYviut@ep-morning-dust-apbe8qu4-pooler.c-7.us-east-1.aws.neon.tech/eduflow_gia_001?sslmode=require" --force $COMMON_OPTS

# 5. NEON_HOST
echo "  Setting NEON_HOST..."
vercel env add NEON_HOST production --value "ep-morning-dust-apbe8qu4-pooler.c-7.us-east-1.aws.neon.tech" --force $COMMON_OPTS

# 6. NEON_DIRECT_HOST
echo "  Setting NEON_DIRECT_HOST..."
vercel env add NEON_DIRECT_HOST production --value "ep-morning-dust-apbe8qu4.c-7.us-east-1.aws.neon.tech" --force $COMMON_OPTS

# 7. NEON_USER
echo "  Setting NEON_USER..."
vercel env add NEON_USER production --value "neondb_owner" --force $COMMON_OPTS

# 8. NEON_PASSWORD
echo "  Setting NEON_PASSWORD..."
vercel env add NEON_PASSWORD production --value "npg_3B6CHnzYviut" --force $COMMON_OPTS

# 9. NEON_REGION
echo "  Setting NEON_REGION..."
vercel env add NEON_REGION production --value "us-east-1" --force $COMMON_OPTS

echo ""
echo "✅ All environment variables have been set!"
echo ""
echo "📊 Verifying env vars..."
vercel env ls production --cwd "$PROJECT_DIR" ${TOKEN:+--token $TOKEN} 2>&1 || true

echo ""
echo "🚀 You may need to redeploy for changes to take effect:"
echo "   vercel --prod --cwd $PROJECT_DIR ${TOKEN:+--token $TOKEN}"
