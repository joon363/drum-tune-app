@echo off
echo ===================================================
echo     TuneBot Drum Tuner - Android Install Script
echo ===================================================
echo.

echo [1/3] Checking connected Android devices...
adb devices
echo.

echo [2/3] Installing APK to your phone...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed. Please make sure:
    echo   - Phone is unlocked
    echo   - USB Debugging is ON
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo [SUCCESS] App installed successfully!
echo [3/3] Launching TuneBot on your phone...
echo ===================================================
adb shell am start -n com.drumtuner.tunebot/com.drumtuner.tunebot.MainActivity
echo.
pause
