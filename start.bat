@echo off
title SYNAPES Auto Tool — Studio Web Service
echo ========================================================
echo   SYNAPES AUTO TOOL - HE THONG SAN XUAT VIDEO AI
echo   May Chu Web Studio Sieu Toc (Instant Production Engine)
echo ========================================================
echo.
cd /d "%~dp0"

:: Kiem tra neu thu muc dist chua duoc build thi tien hanh build nhanh
if not exist "dist\index.html" (
    echo [1/3] Dang khoi tao goi giao dien lan dau (npm run build)...
    call npm run build
    if errorlevel 1 (
        echo [Loi]: Khong the build ma nguon frontend!
        pause
        exit /b 1
    )
)

echo [2/3] Dang khoi dong Web Studio tren cong 10000...
echo.
echo ========================================================
echo   TRUY CAP STUDIO TAI: http://localhost:10000
echo   De dung may chu: Nhan to hop phim Ctrl + C
echo ========================================================
echo.

:: Mo trinh duyet tu dong sau 1 giay de dam bao may chu da san sang
start "" http://localhost:10000

:: Chay may chu Web Service production toc do cao
node server.js
pause
