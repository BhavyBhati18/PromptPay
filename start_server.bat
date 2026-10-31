@echo off
title AI Search & Earn Server
color 0A
cd /d "%~dp0server"

echo ===================================================
echo     AI Search & Earn - Backend & Website Server
echo ===================================================
echo.
echo Server starting at http://localhost:3000
echo Keep this window open while using the app or website!
echo.
echo Press Ctrl+C at any time to stop the server.
echo ===================================================
echo.

node index.js
pause
