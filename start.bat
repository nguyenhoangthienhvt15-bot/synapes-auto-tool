@echo off
title SYNAPES Auto Tool - Automated Video Publisher
echo ========================================================
echo   SYNAPES AUTO TOOL - HE THONG DANG VIDEO DA NEN TANG
echo   Apple HIG Warm Light Theme (Anti AI-Slop Design)
echo   YouTube (5-10 Phut), TikTok, Facebook Reels
echo ========================================================
echo.
cd /d "%~dp0"
echo Dang khoi dong may chu giao dien nguoi dung...
echo Truy cap tai: http://localhost:5173
echo.
npm run dev -- --open
pause
