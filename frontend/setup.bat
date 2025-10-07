@echo off
echo 🚀 Setting up DOC.X Intelligent Frontend...
echo ========================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ npm found: 
npm --version

:: Navigate to frontend directory
cd /d "%~dp0"

echo 📦 Installing dependencies...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
    echo.
    echo 🎉 Setup complete!
    echo.
    echo To start the development server:
    echo   npm run dev
    echo.
    echo To build for production:
    echo   npm run build
    echo.
    echo The frontend will be available at: http://localhost:3000
    echo Make sure the backend is running at: http://127.0.0.1:5000
    echo.
    pause
) else (
    echo ❌ Failed to install dependencies. Please check the error messages above.
    pause
    exit /b 1
)