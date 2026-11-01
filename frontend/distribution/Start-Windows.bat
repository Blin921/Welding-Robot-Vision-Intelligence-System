@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js 24 LTS or newer from https://nodejs.org/
  pause
  exit /b 1
)
node launch.cjs
pause
