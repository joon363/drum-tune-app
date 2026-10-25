Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    TuneBot Drum Tuner - 안드로이드 폰 설치 스크립트" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 연결된 안드로이드 기기 확인 중..." -ForegroundColor Yellow
adb devices
Write-Host ""

Write-Host "2. APK 설치 진행 중..." -ForegroundColor Yellow
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "[완료] TuneBot 앱이 성공적으로 설치되었습니다!" -ForegroundColor Green
    Write-Host "3. 스마트폰에서 앱을 실행합니다..." -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
    adb shell am start -n com.drumtuner.tunebot/com.drumtuner.tunebot.MainActivity
} else {
    Write-Host ""
    Write-Host "[오류] 설치에 실패했습니다. USB 디버깅 및 잠금 해제를 확인해 주세요." -ForegroundColor Red
}
