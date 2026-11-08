@echo off
title SYNAPES Auto Tool — Developer Mode (Vite Dev Server)
echo ========================================================
echo   SYNAPES AUTO TOOL - CHE DO NHA PHAT TRIEN (HMR HOT-RELOAD)
echo ========================================================
echo.
cd /d "%~dp0"

echo Dang khoi dong may chu phat trien Vite tren port 5173...
echo.
echo   TRUY CAP DEV STUDIO TAI: http://localhost:5173
echo   (Che do nay danh rieng cho lap trinh vien can sua code truc tiep)
echo   De chay ban production sieu toc, hay dung start.bat
echo ========================================================
echo.

npm run dev -- --host 127.0.0.1
pause

