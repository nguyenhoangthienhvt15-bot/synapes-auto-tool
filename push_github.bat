@echo off
title Day code len GitHub de Render tu dong Deploy
echo ========================================================
echo   SYNAPES AUTO TOOL - HUONG DAN DEPLOY LEN RENDER
echo ========================================================
echo.
echo Buoc 1: Tao repository moi tren GitHub:
echo         Truy cap: https://github.com/new
echo         Dat ten: synapes-auto-tool (Public hoac Private deu duoc)
echo         Khong tich chon "Add a README file"
echo.
set /p REPO_URL="Buoc 2: Dan link GitHub Repository vao day (VD: https://github.com/username/synapes-auto-tool.git): "
echo.
if "%REPO_URL%"=="" (
    echo [Loi]: Ban chua nhap link GitHub repository!
    pause
    exit /b
)
echo Dang ket noi den: %REPO_URL% ...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main
echo.
echo ========================================================
echo DA DAY MA NGUON LEN GITHUB THANH CONG!
echo.
echo Buoc 3: Deploy len Render (hoan toan mien phi):
echo   1. Truy cap https://dashboard.render.com
echo   2. Bam nut "New +" o goc phai -> Chon "Web Service" (hoac "Blueprint" de tu doc render.yaml)
echo   3. Chon repository vua day len (Connect repository)
echo   4. Thiet lap thong so Web Service:
echo      - Name: synapes-auto-tool
echo      - Runtime: Node
echo      - Build Command: npm install && npm run build
echo      - Start Command: node server.js
echo      - Plan: Free
echo   5. Bam "Deploy Web Service" -> Cho 1-2 phut la hoan tat!
echo   Luu y: Tren goi Render Free, neu khong co nguoi truy cap sau 15 phut,
echo   may chu se ngu dong (Spin down) va mat ~50s khoi dong o lan truy cap dau tien.
echo ========================================================
pause

