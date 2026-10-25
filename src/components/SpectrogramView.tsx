import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, Sliders, Zap, ChevronDown } from 'lucide-react';
import { DrumItem, DetectedPitchInfo } from '../types';
import { frequencyToNote } from '../utils/audioMath';
import { audioEngine } from '../services/audioEngine';

interface SpectrogramViewProps {
  onBack: () => void;
  detectedPitch: DetectedPitchInfo | null;
  drum?: DrumItem;
  drums?: DrumItem[];
  onSelectDrum?: (drum: DrumItem) => void;
}

// Color map palette: Deep Black -> Cyan/Teal -> Magenta/Purple -> Gold/Amber -> White
function getSpectrogramColor(value: number): [number, number, number] {
  if (value < 0.10) {
    const t = value / 0.10;
    return [Math.floor(4 * t), Math.floor(8 * t), Math.floor(22 * t)];
  } else if (value < 0.32) {
    const t = (value - 0.10) / 0.22;
    return [Math.floor(4 + 20 * t), Math.floor(20 + 175 * t), Math.floor(45 + 205 * t)];
  } else if (value < 0.65) {
    const t = (value - 0.32) / 0.33;
    return [Math.floor(24 + 196 * t), Math.floor(195 - 155 * t), Math.floor(250 - 55 * t)];
  } else if (value < 0.88) {
    const t = (value - 0.65) / 0.23;
    return [Math.floor(220 + 35 * t), Math.floor(40 + 175 * t), Math.floor(195 - 175 * t)];
  } else {
    const t = (value - 0.88) / 0.12;
    return [255, Math.floor(215 + 40 * t), Math.floor(20 + 235 * t)];
  }
}

// Musical pitch range: C1 (~32.7 Hz) to C6 (~1046.5 Hz)
const MIN_MIDI = 24; // C1
const MAX_MIDI = 84; // C6 (5 full octaves)

// Major note landmarks (C, E, G per octave) spaced neatly on vertical axis
const DISPLAY_LANDMARKS = [
  { midi: 84, name: 'C6', isRoot: true },
  { midi: 79, name: 'G5', isRoot: false },
  { midi: 76, name: 'E5', isRoot: false },
  { midi: 72, name: 'C5', isRoot: true },
  { midi: 67, name: 'G4', isRoot: false },
  { midi: 64, name: 'E4', isRoot: false },
  { midi: 60, name: 'C4', isRoot: true },
  { midi: 55, name: 'G3', isRoot: false },
  { midi: 52, name: 'E3', isRoot: false },
  { midi: 48, name: 'C3', isRoot: true },
  { midi: 43, name: 'G2', isRoot: false },
  { midi: 40, name: 'E2', isRoot: false },
  { midi: 36, name: 'C2', isRoot: true },
  { midi: 31, name: 'G1', isRoot: false },
  { midi: 28, name: 'E1', isRoot: false },
  { midi: 24, name: 'C1', isRoot: true },
];

export const SpectrogramView: React.FC<SpectrogramViewProps> = ({
  onBack,
  detectedPitch,
  drum,
  drums,
  onSelectDrum,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [gain, setGain] = useState<number>(1.1); // lowered default from 1.6 to 1.1
  const [speed, setSpeed] = useState<number>(2); // lowered default from 3 to 2
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 600 });

  // Pitch info for top header & real-time peak line
  const currentHz = detectedPitch?.frequency || 0;
  const currentHzRef = useRef<number>(currentHz);
  currentHzRef.current = currentHz;

  const noteInfo = currentHz > 0 ? frequencyToNote(currentHz) : { fullName: '--', cents: 0 };
  const currentNote = noteInfo.fullName;
  const cents = noteInfo.cents;

  // Selected drum target pitch labels and position helpers
  const topLabel = drum?.type === 'bass' ? '타격면' : drum?.type === 'snare' ? '타격면' : '윗면';
  const bottomLabel = drum?.type === 'bass' ? '전면' : drum?.type === 'snare' ? '스네어사이드' : '아랫면';

  const getPitchYPercent = (freq: number): number | null => {
    if (!freq || freq <= 0) return null;
    const midi = 69 + 12 * Math.log2(freq / 440);
    if (midi < MIN_MIDI || midi > MAX_MIDI) return null;
    return ((MAX_MIDI - midi) / (MAX_MIDI - MIN_MIDI)) * 100;
  };

  const liveYPercent = getPitchYPercent(currentHz);

  const targetLines = drum
    ? [
      {
        id: 'fund',
        label: '기본음',
        hz: drum.targetFundamentalHz,
        note: frequencyToNote(drum.targetFundamentalHz).fullName,
        yPercent: getPitchYPercent(drum.targetFundamentalHz),
        borderClass: 'border-cyan-400 border-solid',
        shadowClass: '',
        badgeClass: 'bg-slate-950 text-cyan-300 border border-cyan-400',
        dotClass: 'bg-cyan-400',
        canvasColor: 'rgba(6, 182, 212, 0.85)',
        canvasDash: [],
      },
      {
        id: 'top',
        label: topLabel,
        hz: drum.targetTopLugHz,
        note: frequencyToNote(drum.targetTopLugHz).fullName,
        yPercent: getPitchYPercent(drum.targetTopLugHz),
        borderClass: 'border-amber-400 border-dashed',
        shadowClass: '',
        badgeClass: 'bg-slate-950 text-amber-300 border border-amber-400',
        dotClass: 'bg-amber-400',
        canvasColor: 'rgba(245, 158, 11, 0.85)',
        canvasDash: [8, 4],
      },
      {
        id: 'bottom',
        label: bottomLabel,
        hz: drum.targetBottomLugHz,
        note: frequencyToNote(drum.targetBottomLugHz).fullName,
        yPercent: getPitchYPercent(drum.targetBottomLugHz),
        borderClass: 'border-rose-400 border-dashed',
        shadowClass: '',
        badgeClass: 'bg-slate-950 text-rose-300 border border-rose-400',
        dotClass: 'bg-rose-400',
        canvasColor: 'rgba(244, 63, 94, 0.85)',
        canvasDash: [8, 4],
      },
    ]
    : [];

  // Measure container dimensions for high-DPI resolution
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 50 && h > 100) {
          setDimensions({ width: w, height: h });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Continuous 60fps real-time HD Waterfall
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use devicePixelRatio for Retina/HD sharpness
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    const pixelWidth = Math.floor(dimensions.width * dpr);
    const pixelHeight = Math.floor(dimensions.height * dpr);

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = pixelWidth;
    offscreen.height = pixelHeight;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.fillStyle = '#05070c';
    offCtx.fillRect(0, 0, pixelWidth, pixelHeight);
    offscreenRef.current = offscreen;

    let animId: number;
    const rawFreqBuffer = new Uint8Array(4096);
    const stepWidth = Math.max(1, Math.round(speed * (dpr / 1.5)));

    let lastTime = performance.now();
    let accumulatedTime = 0;
    const FRAME_MS = 1000 / 60; // 16.66ms (Standard 60fps pace for smooth waterfall scroll)

    const render = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      accumulatedTime += delta;
      if (accumulatedTime > 150) accumulatedTime = 150;

      if (!isPaused) {
        while (accumulatedTime >= FRAME_MS) {
          accumulatedTime -= FRAME_MS;

          // 1. Shift canvas left
          offCtx.drawImage(
            offscreen,
            stepWidth,
            0,
            pixelWidth - stepWidth,
            pixelHeight,
            0,
            0,
            pixelWidth - stepWidth,
            pixelHeight
          );

          // 2. Fetch live raw 4096-bin FFT data from audioEngine
          const { data: freqData, sampleRate } = audioEngine.getLatestFrequencyData(rawFreqBuffer);
          const binCount = freqData.length;
          const binHz = (sampleRate / 2) / binCount;

          // 3. Render continuous high-resolution frequency column
          const colData = offCtx.createImageData(stepWidth, pixelHeight);

          for (let y = 0; y < pixelHeight; y++) {
            const frac = y / pixelHeight;
            const midi = MAX_MIDI - frac * (MAX_MIDI - MIN_MIDI);
            const f = 440 * Math.pow(2, (midi - 69) / 12);

            const binFloat = f / binHz;
            let magnitude = 0;

            if (binFloat >= 0 && binFloat < binCount - 1) {
              const b0 = Math.floor(binFloat);
              const b1 = b0 + 1;
              const t = binFloat - b0;
              // Linear interpolate between adjacent FFT bins for smooth resolution
              magnitude = freqData[b0] * (1 - t) + freqData[b1] * t;
            } else if (binFloat >= binCount - 1 && binFloat < binCount) {
              magnitude = freqData[binCount - 1];
            }

            // Apply gain and normalize
            const normalized = Math.min(1.0, Math.max(0.0, (magnitude / 255) * gain));
            const [r, g, b] = getSpectrogramColor(normalized);

            for (let px = 0; px < stepWidth; px++) {
              const idx = (y * stepWidth + px) * 4;
              colData.data[idx] = r;
              colData.data[idx + 1] = g;
              colData.data[idx + 2] = b;
              colData.data[idx + 3] = 255;
            }
          }

          offCtx.putImageData(colData, pixelWidth - stepWidth, 0);
        }

        // 4. Draw to main canvas
        ctx.drawImage(offscreen, 0, 0);

        // 5. Draw faint guide wires
        for (let i = 0; i < DISPLAY_LANDMARKS.length; i++) {
          const item = DISPLAY_LANDMARKS[i];
          const y = ((MAX_MIDI - item.midi) / (MAX_MIDI - MIN_MIDI)) * pixelHeight;

          ctx.lineWidth = item.isRoot ? 1.5 * dpr : 1 * dpr;
          ctx.strokeStyle = item.isRoot ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(pixelWidth, y);
          ctx.stroke();
        }

        // 6. Draw selected drum target pitch lines directly on canvas
        for (let i = 0; i < targetLines.length; i++) {
          const t = targetLines[i];
          if (t.yPercent !== null) {
            const y = (t.yPercent / 100) * pixelHeight;
            ctx.save();
            ctx.lineWidth = 2 * dpr;
            ctx.strokeStyle = t.canvasColor;
            if (t.canvasDash.length > 0) {
              ctx.setLineDash(t.canvasDash.map((d) => d * dpr));
            }
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(pixelWidth, y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // 7. Draw Real-time Detected Peak Line directly on canvas (실시간 피크 위치)
        const liveHz = currentHzRef.current;
        if (liveHz > 25) {
          const liveMidi = 69 + 12 * Math.log2(liveHz / 440);
          if (liveMidi >= MIN_MIDI && liveMidi <= MAX_MIDI) {
            const liveY = ((MAX_MIDI - liveMidi) / (MAX_MIDI - MIN_MIDI)) * pixelHeight;
            ctx.save();
            ctx.lineWidth = 2 * dpr;
            ctx.strokeStyle = '#34d399'; // vivid emerald-400
            ctx.beginPath();
            ctx.moveTo(0, liveY);
            ctx.lineTo(pixelWidth, liveY);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, gain, speed, dimensions, drum]);

  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clampedCents + 50) / 100) * 100;

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col select-none text-white overflow-hidden">
      {/* Top Header (Clean, sleek, and uncluttered) */}
      <div className="pt-2 pb-1.5 px-4 bg-slate-950/90 border-b border-slate-900/90 flex flex-col z-30 backdrop-blur-md">
        <div className="flex items-center justify-between relative">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <ArrowLeft size={15} />
            <span>튜너</span>
          </button>

          {/* Tom Selector Dropdown (헤더 제목 위치) */}
          {drum && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-300 font-bold text-xs transition active:scale-95 shadow-sm"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${drum.type === 'bass'
                    ? 'bg-rose-400'
                    : drum.type === 'snare'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                    }`}
                />
                <span>{drum.name}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && drums && drums.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1 divide-y divide-slate-800/60 backdrop-blur-md">
                    {drums.map((d) => {
                      const isCur = d.id === drum.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onSelectDrum?.(d);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between rounded-lg transition ${isCur
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${d.type === 'bass'
                                ? 'bg-rose-400'
                                : d.type === 'snare'
                                  ? 'bg-amber-400'
                                  : 'bg-cyan-400'
                                }`}
                            />
                            <span>{d.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {d.targetFundamentalNote} ({d.targetFundamentalHz.toFixed(0)}Hz)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pause / Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-xl border transition active:scale-95 shadow-sm ${isPaused
              ? 'bg-amber-950 text-amber-300 border-amber-500/50'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            title={isPaused ? '화면 재개' : '화면 일시정지'}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>

      {/* Main Screen-Height-Fit Spectrogram Container */}
      <div className="relative flex-1 w-full bg-black overflow-hidden flex">
        {/* Left Vertical Note Axis: Nicely spaced note landmarks */}
        <div className="w-11 bg-slate-950 border-r border-slate-900 flex-shrink-0 relative pointer-events-none select-none">
          {DISPLAY_LANDMARKS.map((item) => {
            const yPercent = ((MAX_MIDI - item.midi) / (MAX_MIDI - MIN_MIDI)) * 100;
            return (
              <div
                key={item.midi}
                className={`absolute left-0 right-0 -translate-y-1/2 px-1 text-center font-mono text-[11px] font-bold ${item.isRoot ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                style={{ top: `${yPercent}%` }}
              >
                {item.name}
              </div>
            );
          })}

          {/* Left Axis Target Indicator Dots */}
          {targetLines.map((target) => {
            if (target.yPercent === null) return null;
            return (
              <div
                key={`axis-${target.id}`}
                className="absolute right-0 -translate-y-1/2 flex items-center pr-0.5 z-30"
                style={{ top: `${target.yPercent}%` }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${target.dotClass}`} />
              </div>
            );
          })}
        </div>

        {/* Real-time Continuous High-Resolution FFT Waterfall Canvas */}
        <div ref={containerRef} className="relative flex-1 h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {/* Selected Drum Target Pitch Horizontal Lines Overlay */}
          {targetLines.map((target) => {
            if (target.yPercent === null) return null;
            return (
              <div
                key={target.id}
                className="absolute left-0 right-0 -translate-y-1/2 pointer-events-none z-20 flex items-center"
                style={{ top: `${target.yPercent}%` }}
              >
                {/* Horizontal Guide Line */}
                <div
                  className={`w-full border-t-2 ${target.borderClass}`}
                />

                {/* Left Badge with Label, Note & Hz */}
                <div className="absolute left-2.5 -translate-y-1/2 flex items-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold backdrop-blur-md flex items-center gap-1.5 ${target.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${target.dotClass}`} />
                    <span>{target.label}</span>
                    <span className="font-extrabold">{target.note}</span>
                    <span className="opacity-80 font-normal">({target.hz.toFixed(1)}Hz)</span>
                  </span>
                </div>
              </div>
            );
          })}
          {/* Real-time Detected Peak Live Horizontal Line & Right Badge (실시간 피크 위치) */}
          {liveYPercent !== null && (
            <div
              className="absolute left-0 right-0 -translate-y-1/2 pointer-events-none z-30 flex items-center transition-all duration-75 ease-out"
              style={{ top: `${liveYPercent}%` }}
            >
              {/* Clean Emerald Laser Line without glow */}
              <div className="w-full border-t-2 border-emerald-400" />

              {/* Right Live Peak Badge without glow */}
              <div className="absolute right-3 -translate-y-1/2 flex items-center">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-950 text-emerald-300 border border-emerald-400 flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-sans text-[10px] text-emerald-400 font-semibold">Peak</span>
                  <span className="text-white font-extrabold">{currentHz.toFixed(1)}Hz</span>
                  <span className="text-emerald-300 font-bold">({currentNote})</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls on Bottom-Right (세로 슬라이더 & 투명 배경 & 무글로우) */}
        <div className="fixed bottom-5 right-3 z-40 bg-transparent flex items-end gap-2.5 select-none pointer-events-auto">
          {/* 감도 (Gain) Vertical Slider */}
          <div className="flex flex-col items-center gap-1 bg-transparent">
            <span className="text-[10px] font-mono text-cyan-300 font-bold bg-black/70 px-1.5 py-0.5 rounded border border-cyan-800/40">
              x{gain.toFixed(1)}
            </span>
            <div className="py-1 flex items-center justify-center">
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.05"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  WebkitAppearance: 'slider-vertical',
                  width: '28px',
                  height: '115px',
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded border border-cyan-800/40">
              <Sliders size={11} />
              감도
            </span>
          </div>

          {/* 속도 (Speed) Vertical Slider */}
          <div className="flex flex-col items-center gap-1 bg-transparent">
            <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/70 px-1.5 py-0.5 rounded border border-amber-800/40">
              {speed}단계
            </span>
            <div className="py-1 flex items-center justify-center">
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                className="accent-amber-400 cursor-pointer"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  WebkitAppearance: 'slider-vertical',
                  width: '28px',
                  height: '115px',
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded border border-amber-800/40">
              <Zap size={11} />
              속도
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
