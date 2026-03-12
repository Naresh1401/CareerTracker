#!/usr/bin/env bash
# ============================================================
# CareerTrack Pro — Setup Script
# ============================================================
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     CareerTrack Pro — Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Check Node.js ──────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18+ first."
  echo "   https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required. Found: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# ── Check npm ──────────────────────────────────────────────
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed."
  exit 1
fi
echo "✅ npm $(npm -v)"

# ── Install dependencies ──────────────────────────────────
echo ""
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# ── Environment variables ─────────────────────────────────
echo ""
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "📝 Created .env from .env.example"
  else
    cat > .env << 'EOF'
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EOF
    echo "📝 Created .env file"
  fi
  echo ""
  echo "⚠️  Configure your Supabase credentials in .env:"
  echo "   VITE_SUPABASE_URL=https://your-project.supabase.co"
  echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
  echo ""
  echo "   Get these from: Supabase Dashboard → Settings → API"
else
  echo "✅ .env file exists"
fi

# ── Database reminder ─────────────────────────────────────
echo ""
echo "🗄️  Database Setup:"
echo "   1. Go to your Supabase Dashboard → SQL Editor"
echo "   2. Create a new query"
echo "   3. Paste the contents of supabase-schema.sql"
echo "   4. Click Run"
echo ""

# ── Done ──────────────────────────────────────────────────
echo "╔══════════════════════════════════════╗"
echo "║          Setup Complete!             ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Start the dev server:"
echo "    npm run dev"
echo ""
echo "  Build for production:"
echo "    npm run build"
echo ""
