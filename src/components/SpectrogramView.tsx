import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, Sliders, Zap } from 'lucide-react';
import { DrumItem, DetectedPitchInfo } from '../types';
import { frequencyToNote } from '../utils/audioMath';
import { audioEngine } from '../services/audioEngine';

interface SpectrogramViewProps {
  onBack: () => void;
  detectedPitch: DetectedPitchInfo | null;
  drum?: DrumItem;
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gain, setGain] = useState<number>(1.6);
  const [speed, setSpeed] = useState<number>(3); // Scrolling speed: 1 ~ 6 px/frame
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 600 });

  // Pitch info for top header
  const currentHz = detectedPitch?.frequency || 0;
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

  const targetLines = drum
    ? [
        {
          id: 'fund',
          label: '기본음',
          hz: drum.targetFundamentalHz,
          note: frequencyToNote(drum.targetFundamentalHz).fullName,
          yPercent: getPitchYPercent(drum.targetFundamentalHz),
          borderClass: 'border-cyan-400 border-solid',
          shadowClass: 'shadow-[0_0_12px_rgba(6,182,212,0.9)]',
          badgeClass: 'bg-slate-950/90 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
          dotClass: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
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
          shadowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.9)]',
          badgeClass: 'bg-slate-950/90 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
          dotClass: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
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
          shadowClass: 'shadow-[0_0_12px_rgba(244,63,94,0.9)]',
          badgeClass: 'bg-slate-950/90 text-rose-300 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
          dotClass: 'bg-rose-400 shadow-[0_0_6px_#fb7185]',
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

    const render = () => {
      if (!isPaused) {
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
      {/* Top Header (Clean and minimal) */}
      <div className="pt-2 pb-2 px-4 bg-slate-950 border-b border-slate-900 flex flex-col z-30">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            튜너 화면으로
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg border transition ${
              isPaused
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>

        {/* Top Tuner Needle Bar */}
        <div className="relative w-full max-w-md mx-auto h-5 flex items-center justify-center px-4">
          <div className="w-full h-1 bg-slate-800 rounded-full relative">
            <div className="absolute left-1/2 -top-2 w-6 h-5 bg-emerald-950 border border-emerald-500 -translate-x-1/2" />
            <div className="absolute left-1/2 -top-2 w-[2px] h-5 bg-emerald-400 -translate-x-1/2 z-10" />

            <div
              className="absolute -top-2.5 w-1.5 h-6 bg-red-500 rounded-sm -translate-x-1/2 transition-all duration-75 z-20"
              style={{ left: `${needlePercent}%` }}
            />
          </div>
        </div>

        {/* Readout row: A=440, Note Name with Octave, Frequency */}
        <div className="flex items-center justify-between px-2 mt-0.5">
          <span className="text-xs font-mono text-slate-500">A=440</span>
          <span className="text-xl font-mono font-bold text-white">
            {currentNote}
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentHz > 0 ? `${currentHz.toFixed(1)} Hz` : '-- Hz'}
          </span>
        </div>

        {/* Selected Drum & Target Pitches Summary Header */}
        {drum && (
          <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 mt-1 border-t border-slate-850 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{drum.name} 타겟:</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                <span className="w-2.5 h-[2px] bg-cyan-400 inline-block shadow-[0_0_4px_#22d3ee]" />
                기본음 {frequencyToNote(drum.targetFundamentalHz).fullName} ({drum.targetFundamentalHz.toFixed(1)}Hz)
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <span className="w-2.5 h-[2px] bg-amber-400 inline-block shadow-[0_0_4px_#fbbf24]" />
                {topLabel} {frequencyToNote(drum.targetTopLugHz).fullName} ({drum.targetTopLugHz.toFixed(1)}Hz)
              </span>
              <span className="flex items-center gap-1 text-rose-300 font-semibold">
                <span className="w-2.5 h-[2px] bg-rose-400 inline-block shadow-[0_0_4px_#fb7185]" />
                {bottomLabel} {frequencyToNote(drum.targetBottomLugHz).fullName} ({drum.targetBottomLugHz.toFixed(1)}Hz)
              </span>
            </div>
          </div>
        )}
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
                className={`absolute left-0 right-0 -translate-y-1/2 px-1 text-center font-mono text-[11px] font-bold ${
                  item.isRoot ? 'text-cyan-400' : 'text-slate-500'
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
                  className={`w-full border-t-2 ${target.borderClass} ${target.shadowClass}`}
                />

                {/* Left Badge with Label, Note & Hz */}
                <div className="absolute left-2.5 -translate-y-1/2 flex items-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 ${target.badgeClass}`}
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
        </div>

        {/* Floating Controls on Bottom-Right (감도 & 속도 슬라이더) */}
        <div className="fixed bottom-5 right-4 z-40 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md">
          {/* 감도 (Gain) Slider */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <Sliders size={13} className="text-cyan-400" />
              감도
            </span>
            <input
              type="range"
              min="0.6"
              max="3.5"
              step="0.1"
              value={gain}
              onChange={(e) => setGain(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 속도 (Speed) Slider */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <Zap size={13} className="text-amber-400" />
              속도
            </span>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              className="w-20 accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
