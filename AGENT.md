# AGENT.md - AI Agent & Developer Architecture Guide

This document is a technical guide for AI agents and software engineers working on the **TuneBot** codebase. It outlines the architectural principles, audio digital signal processing (DSP) pipeline, drum tuning acoustics, state model, and strict UI design constraints.

---

## 1. System Overview & Technology Stack

TuneBot is a high-precision, low-latency drum tuner and audio spectrogram application built for web and packaged for Android via Capacitor.

* **Frontend Framework**: React 18 with TypeScript (Strict mode)
* **Build Tool**: Vite (bundling to `dist/`)
* **Styling**: Tailwind CSS (customized for dark mode and zero-blur solid surfaces)
* **Native Runtime**: Capacitor 6 (`@capacitor/android`, `@capacitor/core`)
* **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`, custom YIN pitch detection, sliding window peak tracking)

---

## 2. Directory Structure

```
tunebotclone/
├── android/               # Native Android Capacitor wrapper & Gradle project
├── dist/                  # Production web bundle compiled by Vite
├── docs/                  # Reference documents & legacy visual assets
│   └── reference/         # Original Tune-Bot tuning guide PDF & notes
├── images/                # Visual documentation screenshots (main.jpg, setting.jpg, specto.jpg)
├── release/               # Pre-built standalone Android APK (DrumTuner.apk)
├── scripts/
│   └── toggleLiveReload.js# Switch between dev live-reload and production bundled assets
├── src/
│   ├── components/
│   │   ├── DrumKitView.tsx         # Interactive drum kit visualizer (3 to 6 drums)
│   │   ├── DrumSettingsModal.tsx   # Per-drum size (inches) & resonance modal
│   │   ├── GlobalSettingsModal.tsx # Scale chord presets, resonance modes, kick recommendations
│   │   ├── HeadTargetCards.tsx     # 3-column target cards (Fundamental, Top Lug, Bottom Lug)
│   │   ├── SpectrogramView.tsx     # Real-time waterfall audio spectrogram & pitch dial
│   │   └── TuningMeter.tsx         # Real-time pitch gauge, error indicator & overtone monitor
│   ├── data/
│   │   └── tuningGuide.ts          # Tune-Bot mathematical tuning lookup tables & formulas
│   ├── types.ts                    # Shared TypeScript interfaces & types
│   ├── App.tsx                     # Top-level state coordinator & audio engine lifecycle
│   ├── index.css                   # Global styles, vertical slider styles, design variables
│   └── main.tsx                    # React DOM entry point
├── capacitor.config.json  # Capacitor native configuration
└── package.json           # NPM scripts & dependencies
```

---

## 3. Audio Engine & Pitch Detection Pipeline

### 3.1. Pipeline Architecture
1. **AudioContext Acquisition**: User taps microphone button; app requests `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })` to obtain raw, uncompressed drum strike acoustics.
2. **Audio Nodes**:
   - `MediaStreamAudioSourceNode`: Captures raw PCM samples.
   - `AnalyserNode`: Configured with `fftSize = 2048` (or 4096 depending on zoom) and `smoothingTimeConstant = 0.2` for agile frequency response.
3. **YIN Pitch Detection**:
   - Time-domain pitch estimation algorithm designed specifically for low-latency, monophonic pitch detection.
   - Uses difference function $d_t(\tau)$ and cumulative mean normalized difference $d'_t(\tau)$ to locate the periodic fundamental without octave jumping.
   - Parabolic interpolation around the local minimum gives sub-bin frequency accuracy (precision down to ±0.5 Hz).
4. **Peak Tracking & 1-Second Sliding Window**:
   - Live drum strikes produce high-energy initial transients followed by rapid harmonic decay.
   - Peak frequency is captured into a sliding time buffer and refreshed periodically (1-second window) to prevent erratic jitter while displaying stable lug readings to the user.
5. **Harmonics & Overtone Calculations**:
   - **Sub-Fundamental / Sub-Octave**: $f_{sub} = f / 2$ (monitored with `↓`).
   - **5th Overtone (Perfect Fifth)**: $f_{5th} = f \times 1.5$ (monitored with `↑`).

---

## 4. Drum Acoustics & Tuning Logic (`tuningGuide.ts`)

TuneBot implements the mathematical principles developed by Overtone Labs (Tune-Bot):

1. **Fundamental Resonance vs. Lug Overtones**:
   - Striking the center of the drum excites the **fundamental mode $(0,1)$** where both heads vibrate in unison across the whole shell.
   - Striking near a lug (~3 to 5 cm from the edge) excites the **lug overtone $(1,1)$**, vibrating at approximately $1.44\times$ to $1.65\times$ the fundamental frequency depending on shell depth, diameter, and head tension.
2. **Resonance Modes**:
   - **Maximum Resonance**: Top lug = Bottom lug ($1.75\times$ fundamental). Sustained, open ring.
   - **High Resonance**: Top lug $1.50\times$, Bottom lug $1.85\times$. Rich tone with natural decay.
   - **Medium Resonance (Default)**: Top lug $1.40\times$, Bottom lug $2.00\times$. Industry-standard balanced punch.
   - **Low Resonance**: Top lug $1.20\times$, Bottom lug $2.30\times$. Short sustain, maximum dry attack.
3. **Target Selection Architecture**:
   - `TuningTargetHead = 'fundamental' | 'top' | 'bottom'`.
   - `HeadTargetCards.tsx` renders a 3-column horizontal grid (`grid-cols-3`):
     1. **기본음 (Fundamental)**: Central pitch target.
     2. **윗면 러그 (Top/Batter Lug)**: Top head target.
     3. **아랫면 러그 (Bottom/Resonant Lug)**: Bottom head target.
   - Each card contains an active selection state, frequency readout, and completion checkmark button.

---

## 5. UI/UX Design System Constraints (Critical Rules)

When modifying any UI component in this codebase, adhere strictly to these principles:

1. **Strict Zero-Blur Policy**:
   - **Never** use `backdrop-blur-*`, `blur-*`, or fuzzy layered alpha backdrops (`bg-slate-900/40`, `bg-black/60`).
   - Use clean, solid, opaque surfaces (`bg-slate-900`, `bg-slate-950`, `bg-slate-800`).
2. **No Neon Glows or Radial Halos**:
   - Avoid `shadow-[0_0_...px_...]`, glowing halos, and gradient rings around text, buttons, or dials.
   - Use crisp 1px borders (`border-slate-800`, `border-cyan-500/50`, `border-emerald-500`) for state definition.
3. **No Middle Dots (`·`)**:
   - Do **not** use middle dots (`·`) in labels, notes, or descriptions. Use clean spacing, hyphens, or parentheses instead.
4. **Slider Alignment**:
   - Vertical sliders use the scoped `.vertical-slider` class in `src/index.css` to guarantee track and thumb center alignment without browser clipping.
5. **Theme Color Consistency**:
   - Primary Interactive / Tuning Active: Cyan (`text-cyan-400`, `bg-cyan-500`, `border-cyan-500`).
   - Fundamental / Ground Tone: Amber (`text-amber-400`, `border-amber-500`).
   - Success / In-Tune: Emerald (`text-emerald-400`, `bg-emerald-500`).
   - Danger / Mismatch: Rose (`text-rose-400`, `border-rose-500`).

---

## 6. Build & Deployment Lifecycle

* **Web Development**:
  ```bash
  npm run dev
  ```
* **Offline APK Production Build**:
  ```bash
  npm run build:apk
  ```
  1. `node scripts/toggleLiveReload.js off` ensures `capacitor.config.json` sets `server: { androidScheme: 'https' }`.
  2. `tsc && vite build` verifies zero TypeScript errors and compiles to `dist/`.
  3. `npx cap sync android` copies web assets to Android project assets.
  4. Gradle compiles `app-debug.apk` in `android/app/build/outputs/apk/debug/`.
  5. The binary is mirrored into `release/DrumTuner.apk` for immediate installation.
* **Direct USB ADB Installation**:
  ```bash
  npm run install:phone
  ```
