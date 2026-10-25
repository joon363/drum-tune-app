import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, Sliders } from 'lucide-react';
import { DetectedPitchInfo } from '../types';
import { frequencyToNote } from '../utils/audioMath';
import { audioEngine } from '../services/audioEngine';

interface SpectrogramViewProps {
  onBack: () => void;
  detectedPitch: DetectedPitchInfo | null;
}

// Color map palette: Black -> Blue/Cyan -> Magenta/Purple -> Gold/Amber -> White
function getSpectrogramColor(value: number): [number, number, number] {
  if (value < 0.10) {
    const t = value / 0.10;
    return [Math.floor(6 * t), Math.floor(10 * t), Math.floor(28 * t)];
  } else if (value < 0.32) {
    const t = (value - 0.10) / 0.22;
    return [Math.floor(6 + 24 * t), Math.floor(28 + 172 * t), Math.floor(58 + 197 * t)];
  } else if (value < 0.65) {
    const t = (value - 0.32) / 0.33;
    return [Math.floor(30 + 190 * t), Math.floor(200 - 150 * t), Math.floor(255 - 50 * t)];
  } else if (value < 0.88) {
    const t = (value - 0.65) / 0.23;
    return [Math.floor(220 + 35 * t), Math.floor(50 + 160 * t), Math.floor(205 - 180 * t)];
  } else {
    const t = (value - 0.88) / 0.12;
    return [255, Math.floor(210 + 45 * t), Math.floor(25 + 230 * t)];
  }
}

// Frequency range: C1 (~32.7 Hz) to C6 (~1046.5 Hz)
const MIN_MIDI = 24; // C1
const MAX_MIDI = 84; // C6 (5 full octaves, covers all drum fundamentals and overtones)

// Major note landmarks (C, E, G per octave) to display cleanly on vertical axis without crowding
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gain, setGain] = useState<number>(1.5);
  const [canvasHeight, setCanvasHeight] = useState<number>(500);

  // Current detected pitch info for top header
  const currentHz = detectedPitch?.frequency || 0;
  const noteInfo = currentHz > 0 ? frequencyToNote(currentHz) : { fullName: '--', cents: 0 };
  const currentNote = noteInfo.fullName;
  const cents = noteInfo.cents;

  // Measure container height to fit the screen exactly
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        if (h > 100) {
          setCanvasHeight(h);
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Continuous 60fps real-time FFT Waterfall
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasHeight <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 500; // Internal buffer resolution
    const height = canvasHeight;

    canvas.width = width;
    canvas.height = height;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.fillStyle = '#05070c';
    offCtx.fillRect(0, 0, width, height);
    offscreenRef.current = offscreen;

    let animId: number;
    const rawFreqBuffer = new Uint8Array(2048);
    const stepWidth = 3;

    const render = () => {
      if (!isPaused) {
        // 1. Shift canvas left
        offCtx.drawImage(offscreen, stepWidth, 0, width - stepWidth, height, 0, 0, width - stepWidth, height);

        // 2. Read live FFT buffer
        const { data: freqData, sampleRate } = audioEngine.getLatestFrequencyData(rawFreqBuffer);
        const binCount = freqData.length;
        const binHz = (sampleRate / 2) / binCount;

        // 3. Render continuous frequency column
        const colData = offCtx.createImageData(stepWidth, height);

        for (let y = 0; y < height; y++) {
          const frac = y / height;
          const midi = MAX_MIDI - frac * (MAX_MIDI - MIN_MIDI);
          const f = 440 * Math.pow(2, (midi - 69) / 12);

          const binFloat = f / binHz;
          let magnitude = 0;

          if (binFloat >= 0 && binFloat < binCount - 1) {
            const b0 = Math.floor(binFloat);
            const b1 = b0 + 1;
            const t = binFloat - b0;
            magnitude = freqData[b0] * (1 - t) + freqData[b1] * t;
          } else if (binFloat >= binCount - 1 && binFloat < binCount) {
            magnitude = freqData[binCount - 1];
          }

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

        offCtx.putImageData(colData, width - stepWidth, 0);

        // 4. Draw to main canvas
        ctx.drawImage(offscreen, 0, 0);

        // 5. Draw guideline wires across screen
        for (let i = 0; i < DISPLAY_LANDMARKS.length; i++) {
          const item = DISPLAY_LANDMARKS[i];
          const y = ((MAX_MIDI - item.midi) / (MAX_MIDI - MIN_MIDI)) * height;

          ctx.lineWidth = item.isRoot ? 1.5 : 1;
          ctx.strokeStyle = item.isRoot ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, gain, canvasHeight]);

  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clampedCents + 50) / 100) * 100;

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col select-none text-white overflow-hidden">
      {/* Top Header */}
      <div className="pt-2 pb-2 px-4 bg-slate-950 border-b border-slate-900 flex flex-col z-30">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            튜너 화면으로
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <Sliders size={13} className="text-cyan-400" />
              <span>감도:</span>
              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.1"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

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
          <span className="text-xs font-mono text-slate-400">A=440</span>
          <span className="text-xl font-mono font-bold text-white">
            {currentNote}
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentHz > 0 ? `${currentHz.toFixed(1)} Hz` : '-- Hz'}
          </span>
        </div>
      </div>

      {/* Main Screen-Height-Fit Spectrogram Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full bg-black overflow-hidden flex"
      >
        {/* Left Vertical Note Axis: Nicely spaced note landmarks matching height-fit */}
        <div className="w-12 bg-slate-950 border-r border-slate-900 flex-shrink-0 relative pointer-events-none select-none">
          {DISPLAY_LANDMARKS.map((item) => {
            const yPercent = ((MAX_MIDI - item.midi) / (MAX_MIDI - MIN_MIDI)) * 100;
            return (
              <div
                key={item.midi}
                className={`absolute left-0 right-0 -translate-y-1/2 px-1 text-center font-mono text-xs font-bold ${
                  item.isRoot ? 'text-cyan-400' : 'text-slate-500'
                }`}
                style={{ top: `${yPercent}%` }}
              >
                {item.name}
              </div>
            );
          })}
        </div>

        {/* Real-time Continuous FFT Waterfall Canvas (Height: 100%) */}
        <div className="relative flex-1 h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
};
