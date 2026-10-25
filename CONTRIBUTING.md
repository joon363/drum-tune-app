# CONTRIBUTING.md - 기여 가이드라인

TuneBot 프로젝트에 기여해 주셔서 감사합니다!  
이 문서는 프로젝트 개발 환경 설정, 코딩 표준, 기여 절차 및 안드로이드 빌드/테스트 워크플로우를 안내합니다.

---

## 🛠️ 개발 환경 설정 (Getting Started)

### 사전 필수 요구 사항
* **Node.js**: v18.0.0 이상
* **npm**: v9.0.0 이상
* **Java Development Kit (JDK)**: OpenJDK 17 이상
* **Android Studio & SDK**: Android 13/14 SDK, Android Build-Tools 34 이상

### 로컬 저장소 복제 및 의존성 설치
```bash
git clone https://github.com/your-repo/tunebotclone.git
cd tunebotclone
npm install
```

---

## 💻 개발 및 테스트 워크플로우

### 1. 웹 브라우저에서 개발
빠른 UI 작업 및 일반 컴포넌트 개발 시 브라우저 환경을 사용합니다.
```bash
npm run dev
```
* 기본 로컬 주소: `http://localhost:3000`

### 2. 안드로이드 실기기 라이브 리로드 (Live Dev)
스마트폰 마이크 입력 반응 및 터치 제스처를 실시간으로 테스트할 때 사용합니다.
```bash
npm run dev:phone
```
* 스마트폰과 PC가 USB로 연결되어 있고 USB 디버깅이 활성화되어 있어야 합니다 (`adb reverse` 자동 실행).

### 3. 타입 체크 및 프로덕션 빌드 검증
PR을 제출하거나 커밋하기 전 반드시 TypeScript 및 번들링 에러가 없는지 확인합니다.
```bash
npm run build
```

### 4. 독립 실행형(오프라인) APK 빌드
번들링된 웹 애셋을 네이티브 안드로이드 프로젝트에 동기화하고 APK를 생성합니다.
```bash
npm run build:apk
```
* 빌드된 APK는 `release/DrumTuner.apk` 및 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다.

---

## 🎨 UI 및 코드 스타일 가이드라인

TuneBot은 드러머들이 어두운 무대나 합주실 환경에서도 높은 시인성과 정밀도를 확보할 수 있도록 엄격한 디자인 규칙을 따릅니다.

1. **뿌연 효과(Blur) 및 네온 글로우 금지**:
   - `backdrop-blur-*` 및 불필요한 퍼지는 그림자(`shadow-[0_0_...px_...]`) 사용을 지양합니다.
   - 단색의 선명한 서피스(`bg-slate-900`, `bg-slate-950`)와 1px 보더(`border-slate-800`)를 통해 가독성을 확보합니다.
2. **가운뎃점(`·`) 사용 금지**:
   - 텍스트 라벨, 설명, 단위 표기 시 가운뎃점을 사용하지 않습니다.
3. **타입 안전성(TypeScript)**:
   - `any` 타입 사용을 지양하고 [types.ts](file:///c:/Users/joon363/dev/tunebotclone/src/types.ts)에 정의된 인터페이스를 적극 활용합니다.
4. **오디오 엔진 무결성**:
   - [SpectrogramView.tsx](file:///c:/Users/joon363/dev/tunebotclone/src/components/SpectrogramView.tsx)나 피치 분석 로직 수정 시 오디오 레이턴시와 메모리 누수(Canvas context 해제, AudioContext 정리)를 반드시 점검해야 합니다.

---

## 📝 커밋 메시지 규칙

커밋 메시지는 Conventional Commits 형식을 권장합니다:

* `feat`: 새로운 기능 추가 (예: `feat: add fundamental tone target card`)
* `fix`: 버그 수정 (예: `fix: center vertical slider thumb alignment`)
* `refactor`: 코드 리팩토링 및 구조 개선 (예: `refactor: clean up loose files in root`)
* `docs`: 문서 수정 (예: `docs: update README with app screenshots`)
* `style`: 스타일 및 UI 수정 (예: `style: remove glowing blur effects in settings modal`)

---

## 🚀 풀 리퀘스트(PR) 제출 절차

1. 저장소를 Fork하고 기능 브랜치를 생성합니다 (`git checkout -b feature/awesome-feature`).
2. 변경 사항을 구현하고 `npm run build`로 타입 검사를 통과하는지 확인합니다.
3. 커밋 후 브랜치에 푸시합니다 (`git push origin feature/awesome-feature`).
4. GitHub에서 Pull Request를 열고 변경 내용과 스크린샷(UI 변경 시)을 첨부합니다.
