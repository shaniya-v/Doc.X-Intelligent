#!/bin/bash

echo "🚀 Setting up DOC.X Intelligent Frontend..."
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Navigate to frontend directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "To start the development server:"
    echo "  npm run dev"
    echo ""
    echo "To build for production:"
    echo "  npm run build"
    echo ""
    echo "The frontend will be available at: http://localhost:3000"
    echo "Make sure the backend is running at: http://127.0.0.1:5000"
else
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi