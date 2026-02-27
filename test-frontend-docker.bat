@echo off
setlocal enabledelayedexpansion

echo Testing frontend Docker build...

cd frontend

echo Checking required files...
if not exist "Dockerfile" (
    echo ERROR: Dockerfile not found!
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json not found!
    exit /b 1
)

if not exist "nginx.conf" (
    echo ERROR: nginx.conf not found!
    exit /b 1
)

echo All required files found.

where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker found, attempting to build...
    docker build -t smart-kitchen-frontend:test .
    if !errorlevel! equ 0 (
        echo Build successful!
        docker run -d -p 8080:80 --name test-frontend smart-kitchen-frontend:test
        echo Container started on port 8080
        echo Test by visiting: http://localhost:8080
    ) else (
        echo Build failed!
        exit /b 1
    )
) else (
    echo Docker not found, skipping build test.
)

echo Frontend Docker setup verification complete.