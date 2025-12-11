@echo off
setlocal enabledelayedexpansion

echo ================================
echo   Create Invoice Request
echo ================================
echo.

set /p SERVER_URL="Enter server URL (e.g., http://localhost:5173): "
if "!SERVER_URL!"=="" (
    echo Error: Server URL is required
    pause
    exit /b 1
)

if "!SERVER_URL:~-1!"=="/" set SERVER_URL=!SERVER_URL:~0,-1!

set /p API_KEY="Enter your API key: "
if "!API_KEY!"=="" (
    echo Error: API key is required
    pause
    exit /b 1
)

set /p AMOUNT="Enter amount (SOL): "
if "!AMOUNT!"=="" (
    echo Error: Amount is required
    pause
    exit /b 1
)

set /p BLOCKCHAIN="Enter blockchain [solana]: "
if "!BLOCKCHAIN!"=="" set BLOCKCHAIN=solana

set /p COIN="Enter coin [solana]: "
if "!COIN!"=="" set COIN=solana

echo.
echo ================================
echo   Sending Request...
echo ================================
echo Server: !SERVER_URL!
echo Blockchain: !BLOCKCHAIN!
echo Coin: !COIN!
echo Amount: !AMOUNT!
echo.

set TEMP_JSON=%TEMP%\invoice_request.json
echo {"blockchain":"!BLOCKCHAIN!","coin":"!COIN!","amount":"!AMOUNT!"} > !TEMP_JSON!

curl -X POST !SERVER_URL!/api/invoices ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer !API_KEY!" ^
  --data-binary @!TEMP_JSON!

del !TEMP_JSON!

echo.
echo.
echo ================================
echo   Request Complete
echo ================================
pause

