@echo off
echo ===================================================
echo   TuneBot - Phone Live Reload Development Mode
echo ===================================================
echo.

echo 1. Forwarding port 3000 to phone...
adb reverse tcp:3000 tcp:3000

echo 2. Enabling Live Reload config...
node scripts/toggleLiveReload.js on

echo 3. Launching app on phone...
adb shell am force-stop com.drumtuner.tunebot
adb shell am start -n com.drumtuner.tunebot/com.drumtuner.tunebot.MainActivity

echo.
echo ===================================================
echo [READY] Vite Dev Server is starting...
echo Save any file (Ctrl+S) and your phone will update!
echo Press Ctrl+C to stop the server when done.
echo ===================================================
echo.
npm run dev
