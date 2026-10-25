import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, ZoomIn, ZoomOut, Sliders, Volume2 } from 'lucide-react';
import { DetectedPitchInfo } from '../types';
import { NOTE_NAMES, BASE_NOTE_FREQUENCIES } from '../constants/tuningGuide';
import { frequencyToNote } from '../utils/audioMath';

interface SpectrogramViewProps {
  onBack: () => void;
  detectedPitch: DetectedPitchInfo | null;
  onSimulateHit: (hz: number) => void;
}

// Color map palette matching specto.png:
// Deep Black -> Blue/Cyan -> Purple/Violet -> Orange/Yellow -> White
function getSpectrogramColor(value: number): [number, number, number] {
  // value is 0.0 to 1.0 (normalized intensity)
  if (value < 0.15) {
    // Noise floor: black to deep dark blue
    const t = value / 0.15;
    return [Math.floor(8 * t), Math.floor(12 * t), Math.floor(30 * t)];
  } else if (value < 0.38) {
    // Low: deep blue to cyan/teal
    const t = (value - 0.15) / 0.23;
    return [Math.floor(10 + 20 * t), Math.floor(30 + 170 * t), Math.floor(60 + 195 * t)];
  } else if (value < 0.65) {
    // Mid: cyan to vivid magenta/purple
    const t = (value - 0.38) / 0.27;
    return [Math.floor(30 + 190 * t), Math.floor(200 - 150 * t), Math.floor(255 - 50 * t)];
  } else if (value < 0.88) {
    // High: purple to bright amber/gold
    const t = (value - 0.65) / 0.23;
    return [Math.floor(220 + 35 * t), Math.floor(50 + 160 * t), Math.floor(205 - 180 * t)];
  } else {
    // Peak: bright gold to white hot
    const t = (value - 0.88) / 0.12;
    return [255, Math.floor(210 + 45 * t), Math.floor(25 + 230 * t)];
  }
}

export const SpectrogramView: React.FC<SpectrogramViewProps> = ({
  onBack,
  detectedPitch,
  onSimulateHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gain, setGain] = useState<number>(1.4);
  const [octaveOffset, setOctaveOffset] = useState<number>(2); // Default centered around Octave 2 & 3 (drum range)

  // Current pitch info
  const currentHz = detectedPitch?.frequency || 109.3;
  const noteInfo = frequencyToNote(currentHz);
  const currentNote = noteInfo.fullName || 'A2';
  const cents = noteInfo.cents || 0;

  // The notes shown on vertical axis in specto.png:
  // Top is high pitch (B), bottom is low pitch (C)
  const octaveNotes = ['B', 'Bb', 'A', 'G#', 'G', 'F#', 'F', 'E', 'Eb', 'D', 'C#', 'C'];

  // Min and max frequencies for the visible range
  // Octave 2 C (65.4Hz) to B (123.5Hz) or span across 2 octaves
  const minFreq = octaveOffset === 1 ? 32.7 : octaveOffset === 2 ? 65.4 : 130.8;
  const maxFreq = minFreq * 4; // 2 full octaves visible

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let xOffset = 0;

    // Buffer to hold history of spectrogram columns
    const width = canvas.width;
    const height = canvas.height;

    // Offscreen canvas for fast scrolling buffer
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.fillStyle = '#06070a';
    offCtx.fillRect(0, 0, width, height);

    const render = () => {
      if (!isPaused) {
        // Shift offscreen canvas 2 pixels to the left
        offCtx.drawImage(offscreen, 2, 0, width - 2, height, 0, 0, width - 2, height);

        // Generate current column based on detected pitch & harmonics or simulated noise
        const imgData = offCtx.createImageData(2, height);

        // Convert current frequency to vertical y coordinate (logarithmic scale)
        // High frequencies at top (y = 0), low frequencies at bottom (y = height)
        const activeY = height - (Math.log2(currentHz / minFreq) / Math.log2(maxFreq / minFreq)) * height;
        const subY = height - (Math.log2((currentHz * 0.5) / minFreq) / Math.log2(maxFreq / minFreq)) * height;
        const overtoneY = height - (Math.log2((currentHz * 1.5) / minFreq) / Math.log2(maxFreq / minFreq)) * height;

        const hasRecentSound = detectedPitch && Date.now() - detectedPitch.timestamp < 600;

        for (let y = 0; y < height; y++) {
          // Calculate baseline noise texture
          let intensity = Math.random() * 0.08;

          if (hasRecentSound) {
            // Main fundamental peak
            const dist = Math.abs(y - activeY);
            if (dist < 18) {
              intensity += Math.exp(-(dist * dist) / 28) * 0.95 * gain;
            }

            // Subharmonic peak
            const subDist = Math.abs(y - subY);
            if (subDist < 12) {
              intensity += Math.exp(-(subDist * subDist) / 20) * 0.65 * gain;
            }

            // Overtone peak
            const overDist = Math.abs(y - overtoneY);
            if (overDist < 14) {
              intensity += Math.exp(-(overDist * overDist) / 24) * 0.75 * gain;
            }
          }

          intensity = Math.min(1.0, Math.max(0.0, intensity));
          const [r, g, b] = getSpectrogramColor(intensity);

          for (let px = 0; px < 2; px++) {
            const idx = (y * 2 + px) * 4;
            imgData.data[idx] = r;
            imgData.data[idx + 1] = g;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 255;
          }
        }

        offCtx.putImageData(imgData, width - 2, 0);

        // Copy to display canvas
        ctx.drawImage(offscreen, 0, 0);

        // Draw note guideline wires matching specto.png
        const totalNotes = octaveNotes.length;
        ctx.lineWidth = 1;
        for (let i = 0; i < totalNotes; i++) {
          const y = (i / totalNotes) * height + height / (totalNotes * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
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
  }, [isPaused, currentHz, gain, minFreq, maxFreq, detectedPitch]);

  // Tuner needle position clamped between -50 cents and +50 cents
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clampedCents + 50) / 100) * 100;

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col select-none text-white overflow-hidden">
      {/* Top Header matching specto.png */}
      <div className="pt-3 pb-2 px-4 bg-slate-950/90 border-b border-slate-900 flex flex-col">
        {/* Navigation & Controls Row */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            튜너 화면으로
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSimulateHit(currentHz)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-mono hover:bg-slate-800 transition"
            >
              <Volume2 size={14} />
              타격 테스트
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-xl border transition ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        </div>

        {/* Top Tuner Needle Bar matching specto.png */}
        <div className="relative w-full max-w-md mx-auto h-6 flex items-center justify-center px-4">
          <div className="w-full h-1 bg-slate-800 rounded-full relative">
            {/* Center target zone mark (green box in specto.png) */}
            <div className="absolute left-1/2 -top-2 w-7 h-5 bg-emerald-600/60 rounded border border-emerald-400 -translate-x-1/2 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="absolute left-1/2 -top-2.5 w-[2px] h-6 bg-emerald-300 -translate-x-1/2 z-10" />

            {/* Red needle moving indicator matching specto.png */}
            <div
              className="absolute -top-3 w-1.5 h-7 bg-red-500 rounded-sm -translate-x-1/2 shadow-[0_0_8px_rgba(239,68,68,0.9)] transition-all duration-75 z-20"
              style={{ left: `${needlePercent}%` }}
            />
          </div>
        </div>

        {/* Readout row: A=440, Big Note Name, Frequency matching specto.png */}
        <div className="flex items-center justify-between px-2 mt-1">
          <span className="text-xs font-mono text-slate-400 tracking-wider">A=440</span>
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            {currentNote}
          </span>
          <span className="text-sm font-mono font-bold text-slate-300">
            {currentHz.toFixed(1)} Hz
          </span>
        </div>
      </div>

      {/* Main Waterfall Spectrogram Area matching specto.png */}
      <div className="relative flex-1 w-full bg-black flex overflow-hidden">
        {/* Left Vertical Note Axis matching specto.png */}
        <div className="w-14 bg-black/85 z-20 flex flex-col justify-between py-2 pl-3 pr-1 border-r border-slate-900 pointer-events-none">
          {octaveNotes.map((note) => {
            const isCurrent = currentNote.includes(note);
            return (
              <span
                key={note}
                className={`font-mono text-base font-extrabold transition-colors tracking-tight ${
                  isCurrent
                    ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] scale-110'
                    : 'text-slate-400'
                }`}
              >
                {note}
              </span>
            );
          })}
        </div>

        {/* Canvas for 60fps scrolling waterfall */}
        <div className="relative flex-1 h-full">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="w-full h-full object-cover block"
          />
        </div>
      </div>

      {/* Bottom Range & Sensitivity Bar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>옥타브 범위:</span>
          {[1, 2, 3].map((oct) => (
            <button
              key={oct}
              onClick={() => setOctaveOffset(oct)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                octaveOffset === oct
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {oct} ~ {oct + 1}옥타브
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span>감도:</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={gain}
            onChange={(e) => setGain(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
