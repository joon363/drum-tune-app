# 🥁 TuneBot - 스마트 드럼 튜너 & 오디오 스펙트로그램

스마트폰 하나로 드럼 세트를 정확하고 일관되게 튜닝할 수 있는 안드로이드 전문 드럼 튜닝 앱입니다.  
복잡한 설정 없이 직관적인 드럼 킷 그래픽과 실시간 피치 감지, 스펙트로그램으로 완벽한 사운드를 만들어보세요.

---

## 📸 주요 화면 및 기능 미리보기

| 1. 홈 화면 (러그 튜너) | 2. 스펙트로그램 워터폴 | 3. 사운드 프리셋 & 설정 |
| :---: | :---: | :---: |
| <img src="images/main.jpg" width="260" alt="홈 화면" /> | <img src="images/specto.jpg" width="260" alt="스펙트로그램 워터폴" /> | <img src="images/setting.jpg" width="260" alt="튜닝 설정" /> |

* **홈 화면 (3분할 러그 튜너 & 드럼 킷)**
  * **실시간 피치 측정**: 타격 시 현재 주파수(Hz)와 오차 게이지를 직관적으로 표시
  * **3분할 러그 타겟**: 기본음(Fundamental), 윗면(Batter), 아랫면(Resonant) 개별 타겟 설정 및 체크
* **스펙트로그램 워터폴 (주파수 시각화)**
  * **실시간 워터폴 그래픽**: 타격 잔향과 배음 분포를 시각적으로 확인
  * **실시간 조절**: 마이크 감도 및 워터폴 스크롤 속도 커스텀
* **사운드 프리셋 & 서스테인 설정**
  * **화음 프리셋**: 장3도, 완전4도, 완전5도 등 음악적 화음 기반 튜닝
  * **공명도(서스테인) 조절**: 4단계(Maximum / High / Medium / Low) 울림에 따른 주파수 설정

---

## 설치 방법

### A. APK 파일 직접 다운로드

1. 저장소의 [`release/DrumTuner.apk`](release/DrumTuner.apk) 파일을 안드로이드 스마트폰에 다운로드합니다.
2. 다운로드한 `.apk` 파일을 터치하여 설치합니다.  
   *(스마트폰 보안 설정에서 '출처를 알 수 없는 앱 설치 허용' 필요 시 허용)*
3. 앱을 실행하고 **마이크(오디오 녹음) 권한**을 허용하면 즉시 드럼 튜닝을 시작할 수 있습니다.

> **PC와 스마트폰이 USB로 연결되어 있는 경우**:  
> 프로젝트 루트의 `install_to_phone.bat`을 더블 클릭하면 자동으로 연결을 확인하고 기기에 즉시 설치 및 실행됩니다.

---

### B. Build from Source

#### 필수 요구 사항
* [Node.js](https://nodejs.org/) (v18 이상 권장)
* Android SDK

#### 1. 저장소 복제 및 패키지 설치
```bash
git clone https://github.com/your-repo/tunebotclone.git
cd tunebotclone
npm install
```

#### 2. 웹 브라우저에서 실행 (로컬 개발)
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 테스트할 수 있습니다.

#### 3. 안드로이드 APK 빌드
```bash
npm run build:apk
```
빌드가 완료되면 `android/app/build/outputs/apk/debug/app-debug.apk` 및 `release/DrumTuner.apk` 파일이 생성됩니다.

#### 4. 연결된 스마트폰에 설치
```bash
npm run install:phone
```

---

## 💡 효과적인 드럼 튜닝 팁
1. **스틱 타격 위치**: 러그 나사에서 약 3cm 떨어진 지점을 일정한 세기로 가볍게 탭합니다.
2. **반대편 헤드 뮤트**: 한쪽 면을 튜닝할 때는 드럼을 의자나 카펫 위에 올려 아랫면을 뮤트시키세요.
3. **기본음 측정**: 뮤트를 없애고 쉘 중앙을 탭하여 드럼 전체의 울림(기본음)을 확인하세요.

### 참고
- 모든 튜닝 정보는 tunebot 사이트의 tunebot tuning guide에서 가져왔습니다.
