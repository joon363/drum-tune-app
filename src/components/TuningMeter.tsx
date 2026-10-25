import React from 'react';
import { DetectedPitchInfo } from '../types';
import { frequencyToNote } from '../utils/audioMath';

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
  const currentHz = detectedPitch?.frequency ?? 0;
  const hasSignal = currentHz > 20;

  // Always compute currentNote from currentHz to guarantee 100% frequency-note alignment
  const currentNote = hasSignal ? frequencyToNote(currentHz).fullName : (detectedPitch?.note ?? '--');

  // Calculate difference in Hz
  const diffHz = hasSignal ? currentHz - targetHz : 0;

  // Requirement: ±2.5Hz ~ 3Hz is considered in-tune (정음)
  const isInTune = hasSignal && Math.abs(diffHz) <= 2.5;

  // Scale: Center is targetHz (0 delta).
  // Range: ±25Hz from target -> -25Hz is 0%, 0Hz is 50%, +25Hz is 100%
  const RANGE_HZ = 25;
  const clampedDiff = Math.max(-RANGE_HZ, Math.min(RANGE_HZ, diffHz));
  const sliderPercent = hasSignal
    ? ((clampedDiff + RANGE_HZ) / (RANGE_HZ * 2)) * 100
    : 50;

  // Secondary harmonics (subharmonic, 5th, overtone)
  const subHz = detectedPitch?.subharmonicHz ?? (hasSignal ? Math.round(currentHz * 0.5 * 10) / 10 : 0);
  const fifthHz = detectedPitch?.fifthHarmonicHz ?? (hasSignal ? Math.round(currentHz * 1.5 * 10) / 10 : 0);
  const overtoneHz = detectedPitch?.overtoneHz ?? (hasSignal ? Math.round(currentHz * 1.62 * 10) / 10 : 0);

  return (
    <div className="w-full flex flex-col items-center pt-2 pb-1 select-none">
      {/* Top Horizontal Tuning Bar: Center is TARGET */}
      <div className="relative w-full max-w-sm h-14 flex flex-col items-center justify-center px-4">
        {/* Target display above center */}
        <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
          타겟: {targetNote} ({targetHz.toFixed(1)}Hz)
        </div>

        {/* Track Line */}
        <div className="w-full h-2 bg-slate-800 rounded-sm relative border border-slate-700">
          {/* Target Zone: ±2.5Hz zone highlighted in green around center */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-950/80 border-x border-emerald-500/60"
            style={{
              left: `${((RANGE_HZ - 2.5) / (RANGE_HZ * 2)) * 100}%`,
              width: `${(5.0 / (RANGE_HZ * 2)) * 100}%`,
            }}
          />

          {/* Exact Center Marker (Target) */}
          <div className="absolute left-1/2 -top-2 bottom-[-8px] w-[2px] bg-cyan-400 -translate-x-1/2 z-10" />

          {/* Subdivisions */}
          <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-slate-600 -translate-x-1/2" />
          <div className="absolute left-3/4 top-0 bottom-0 w-[1px] bg-slate-600 -translate-x-1/2" />

          {/* Moving Indicator Bar showing CURRENT detected Hz */}
          {hasSignal && (
            <div
              className="absolute -top-3 -translate-x-1/2 transition-all duration-100 ease-out z-20 flex flex-col items-center"
              style={{ left: `${sliderPercent}%` }}
            >
              {/* Current Indicator Box */}
              <div
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${isInTune
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-cyan-900 text-cyan-100 border-cyan-400'
                  }`}
              >
                {currentHz.toFixed(1)}
              </div>
              {/* Pointer tick */}
              <div
                className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${isInTune ? 'border-t-emerald-400' : 'border-t-cyan-400'
                  }`}
              />
            </div>
          )}
        </div>

        {/* Scale labels: -25Hz, Target, +25Hz */}
        <div className="w-full flex justify-between text-[9px] font-mono text-slate-500 px-0.5 mt-1.5">
          <span>-25Hz</span>
          <span className="text-cyan-400 font-bold">목표 (0)</span>
          <span>+25Hz</span>
        </div>
      </div>

      {/* Main Frequency & Note Display (Static arrows, no bounce) */}
      <div className="flex flex-col items-center my-1.5">
        <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">
          {currentNote}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white">
            {hasSignal ? `${currentHz.toFixed(1)}Hz` : '-- Hz'}
          </span>
          {hasSignal && (
            <span className="text-2xl font-black">
              {isInTune ? (
                <span className="text-emerald-400">●</span>
              ) : diffHz > 2.5 ? (
                <span className="text-amber-400">▲</span>
              ) : (
                <span className="text-sky-400">▼</span>
              )}
            </span>
          )}
        </div>

        {/* Delta Hz Status (Clean solid badge, no animation) */}
        <div className="flex items-center gap-2 mt-1">
          {hasSignal ? (<div></div>
          ) : (
            <span className="text-xs text-slate-500 font-mono">신호 대기 중</span>
          )}

          {isFilterActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-800">
              필터
            </span>
          )}
        </div>
      </div>

      {/* Sub-harmonics display: (130Hz ▼) (5도 390Hz ▲) (420Hz ▲) */}
      {
        hasSignal && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-1 px-3 py-1 bg-slate-900 rounded border border-slate-800">
            <span>기저 {subHz.toFixed(0)}Hz <span className="text-sky-400">▼</span></span>
            <span className="text-slate-600">|</span>
            <span>5도 {fifthHz.toFixed(0)}Hz <span className="text-amber-400">▲</span></span>
            <span className="text-slate-600">|</span>
            <span>오버톤 {overtoneHz.toFixed(0)}Hz <span className="text-amber-400">▲</span></span>
          </div>
        )
      }
    </div >
  );
};
