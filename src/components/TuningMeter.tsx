import React from 'react';
import { ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { DetectedPitchInfo } from '../types';
import { calculateCentsDifference } from '../utils/audioMath';

interface TuningMeterProps {
  detectedPitch: DetectedPitchInfo | null;
  targetHz: number;
  targetNote: string;
  isFilterActive: boolean;
}

export const TuningMeter: React.FC<TuningMeterProps> = ({
  detectedPitch,
  targetHz,
  targetNote,
  isFilterActive,
}) => {
  const currentHz = detectedPitch?.frequency ?? targetHz;
  const currentNote = detectedPitch?.note ?? targetNote;

  // Calculate difference in Hz and Cents
  const diffHz = currentHz - targetHz;
  const cents = calculateCentsDifference(currentHz, targetHz);
  const isInTune = Math.abs(diffHz) <= 1.5;
  const isSharp = diffHz > 1.5;
  const isFlat = diffHz < -1.5;

  // Slider position: clamp between -50 cents and +50 cents -> 0% to 100%
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const sliderPercent = ((clampedCents + 50) / 100) * 100;

  // Format secondary harmonics
  const subHz = detectedPitch?.subharmonicHz ?? Math.round(currentHz * 0.5 * 10) / 10;
  const fifthHz = detectedPitch?.fifthHarmonicHz ?? Math.round(currentHz * 1.5 * 10) / 10;
  const overtoneHz = detectedPitch?.overtoneHz ?? Math.round(currentHz * 1.62 * 10) / 10;

  return (
    <div className="w-full flex flex-col items-center pt-2 pb-1 select-none">
      {/* Top Horizontal Tuning Bar */}
      <div className="relative w-full max-w-sm h-12 flex items-center justify-center px-4">
        {/* Track Line */}
        <div className="w-full h-1 bg-cyan-700/80 rounded-full relative">
          {/* Center Target Mark */}
          <div className="absolute left-1/2 -top-3.5 -bottom-3.5 w-[3px] bg-cyan-300 rounded shadow-[0_0_10px_rgba(6,182,212,0.8)] -translate-x-1/2 z-10" />

          {/* Subdivisions */}
          <div className="absolute left-1/4 -top-1.5 w-[1px] h-4 bg-cyan-800 -translate-x-1/2" />
          <div className="absolute left-3/4 -top-1.5 w-[1px] h-4 bg-cyan-800 -translate-x-1/2" />

          {/* Moving Indicator Box (matching front.png blue box) */}
          <div
            className="absolute -top-3.5 -translate-x-1/2 transition-all duration-150 ease-out z-20 flex flex-col items-center"
            style={{ left: `${sliderPercent}%` }}
          >
            <div
              className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider shadow-lg border transition-colors ${
                isInTune
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/50'
                  : 'bg-[#1b4d6b] text-cyan-100 border-cyan-400/80 shadow-cyan-900/60'
              }`}
            >
              {targetNote}
            </div>
          </div>
        </div>
      </div>

      {/* Big Main Note & Frequency Display */}
      <div className="flex flex-col items-center my-1">
        <span className="text-xs font-semibold tracking-wider text-cyan-300/80 uppercase">
          {currentNote}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {currentHz > 0 ? `${currentHz.toFixed(1)}Hz` : '-- Hz'}
          </span>

          {/* Direction indicator arrow matching front.png */}
          {isInTune ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
              <CheckCircle2 size={24} />
            </div>
          ) : isSharp ? (
            <div className="flex items-center justify-center text-amber-400 animate-bounce">
              <ArrowUp size={32} strokeWidth={3.5} />
            </div>
          ) : (
            <div className="flex items-center justify-center text-sky-400 animate-bounce">
              <ArrowDown size={32} strokeWidth={3.5} />
            </div>
          )}
        </div>

        {/* Delta Hz & Status */}
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isInTune
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isSharp
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}
          >
            {isInTune ? '정음 (In-Tune)' : isSharp ? `+${diffHz.toFixed(1)}Hz (내림 필요)` : `${diffHz.toFixed(1)}Hz (올림 필요)`}
          </span>
          {isFilterActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
              FILTER ON
            </span>
          )}
        </div>
      </div>

      {/* Sub-harmonics display: (130Hz ▼) (5도화음Hz ▲) (420Hz ▲) matching front.png */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-300/90 mt-1 px-3 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
        <span className="flex items-center gap-0.5 hover:text-white transition">
          ({subHz.toFixed(0)}Hz <ArrowDown size={12} className="inline text-sky-400" />)
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-0.5 hover:text-white transition">
          (5도 {fifthHz.toFixed(0)}Hz <ArrowUp size={12} className="inline text-amber-400" />)
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-0.5 hover:text-white transition">
          ({overtoneHz.toFixed(0)}Hz <ArrowUp size={12} className="inline text-amber-400" />)
        </span>
      </div>
    </div>
  );
};
