@echo off
chcp 65001 >nul
title BrewLite - Prisma Studio
rem Bấm đúp để xem CSDL bằng Prisma Studio. Cần Docker đang chạy BrewLite (docker compose up -d).
cd /d "%~dp0backend"

if not exist .env copy .env.example .env >nul
if not exist node_modules (
  echo Lần đầu chạy: đang cài thư viện backend, đợi khoảng 1 phút...
  call npm ci
)

echo.
echo Prisma Studio: http://localhost:5555
echo Đóng cửa sổ này để tắt.
echo.
call npx prisma studio --port 5555
pause
