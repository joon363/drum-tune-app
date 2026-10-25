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

  // Secondary Harmonics
  const subHz = detectedPitch?.subharmonicHz ?? (hasSignal ? Math.round(currentHz * 0.5 * 10) / 10 : 0);
  const fifthHz = detectedPitch?.fifthHarmonicHz ?? (hasSignal ? Math.round(currentHz * 1.5 * 10) / 10 : 0);
  const overtoneHz = detectedPitch?.overtoneHz ?? (hasSignal ? Math.round(currentHz * 1.62 * 10) / 10 : 0);

  // In-tune checks against targetHz (±2.5Hz)
  const isDirectInTune = hasSignal && Math.abs(currentHz - targetHz) <= 2.5;
  const isSubInTune = hasSignal && Math.abs(subHz - targetHz) <= 2.5;
  const isFifthInTune = hasSignal && Math.abs(fifthHz - targetHz) <= 2.5;
  const isOvertoneInTune = hasSignal && Math.abs(overtoneHz - targetHz) <= 2.5;

  const isAnyInTune = isDirectInTune || isSubInTune || isFifthInTune || isOvertoneInTune;

  // Calculate difference in Hz
  const diffHz = hasSignal ? currentHz - targetHz : 0;

  // Scale: Center is targetHz (0 delta).
  // Range: ±25Hz from target -> -25Hz is 0%, 0Hz is 50%, +25Hz is 100%
  const RANGE_HZ = 25;
  const clampedDiff = Math.max(-RANGE_HZ, Math.min(RANGE_HZ, diffHz));
  const sliderPercent = isAnyInTune
    ? 50
    : hasSignal
      ? ((clampedDiff + RANGE_HZ) / (RANGE_HZ * 2)) * 100
      : 50;

  return (
    <div className="w-full flex flex-col items-center pt-1 pb-1 select-none flex-shrink-0">
      {/* Target Pill Header */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono shadow-sm">
          <span className="text-slate-400 font-sans text-[11px]">Target</span>
          <span className="text-cyan-400 font-bold">{targetNote}</span>
          <span className="text-white font-semibold">{targetHz.toFixed(1)} Hz</span>
          {isFilterActive && (
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-800/60">
              필터
            </span>
          )}
        </span>
      </div>

      {/* Modern Precision Horizontal Tuning Gauge */}
      <div className="w-full max-w-sm px-4 flex flex-col items-center">
        <div className="relative w-full h-3 bg-slate-900/90 rounded-full border border-slate-800/90 flex items-center shadow-inner overflow-visible">
          {/* In-Tune ±2.5Hz Zone Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40 rounded-sm"
            style={{
              left: `${((RANGE_HZ - 2.5) / (RANGE_HZ * 2)) * 100}%`,
              width: `${(5.0 / (RANGE_HZ * 2)) * 100}%`,
            }}
          />

          {/* Center Target Hairline */}
          <div className="absolute left-1/2 -top-1 bottom-[-4px] w-[2px] bg-cyan-400 -translate-x-1/2 z-10 shadow-[0_0_6px_#22d3ee]" />

          {/* Subtle tick markers for ±10Hz */}
          <div className="absolute top-0.5 bottom-0.5 w-[1px] bg-slate-700 -translate-x-1/2" style={{ left: '30%' }} />
          <div className="absolute top-0.5 bottom-0.5 w-[1px] bg-slate-700 -translate-x-1/2" style={{ left: '70%' }} />

          {/* Indicator Needle */}
          {hasSignal && (
            <div
              className="absolute -top-1.5 -translate-x-1/2 transition-all duration-100 ease-out z-20 flex flex-col items-center pointer-events-none"
              style={{ left: `${sliderPercent}%` }}
            >
              <div
                className={`w-3.5 h-6 rounded-full border border-white/60 shadow-lg ${isAnyInTune
                    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                    : diffHz > 2.5
                      ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                      : 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                  }`}
              />
            </div>
          )}
        </div>

        {/* Minimal Scale Legend */}
        <div className="w-full flex justify-between text-[10px] font-mono text-slate-500 px-1 mt-1.5">
          <span>-25 Hz</span>
          <span className="text-cyan-400/90 font-semibold">목표 (0)</span>
          <span>+25 Hz</span>
        </div>
      </div>

      {/* Main Pitch Digital Readout */}
      <div className="flex flex-col items-center mt-1.5 mb-1">
        <span className="text-xs font-mono font-bold text-cyan-400/90 tracking-widest uppercase">
          {currentNote}
        </span>
        <div className="flex items-baseline justify-center">
          <span className="text-5xl font-mono font-black tracking-tight text-white">
            {hasSignal ? currentHz.toFixed(1) : '--'}
          </span>
          <span className="text-sm font-sans font-medium text-slate-400 ml-1.5">Hz</span>
        </div>

        {/* Status Pill */}
        <div className="mt-1">
          {hasSignal ? (
            isDirectInTune ? (
              <div className="px-3.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span>{diffHz >= 0 ? `+${diffHz.toFixed(1)}` : diffHz.toFixed(1)} Hz</span>
                <span className="text-emerald-400 font-bold">●</span>
              </div>
            ) : isFifthInTune ? (
              <div className="px-3.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span>5도 ↑ {fifthHz.toFixed(1)} Hz</span>
                <span className="text-emerald-400 font-bold">●</span>
              </div>
            ) : isOvertoneInTune ? (
              <div className="px-3.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span>오버톤 ↑ {overtoneHz.toFixed(1)} Hz</span>
                <span className="text-emerald-400 font-bold">●</span>
              </div>
            ) : isSubInTune ? (
              <div className="px-3.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span>기저 ↓ {subHz.toFixed(1)} Hz</span>
                <span className="text-emerald-400 font-bold">●</span>
              </div>
            ) : diffHz > 2.5 ? (
              <div className="px-3.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <span>+{diffHz.toFixed(1)} Hz</span>
                <span className="text-amber-400 font-bold">▲</span>
              </div>
            ) : (
              <div className="px-3.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/50 text-sky-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(14,165,233,0.25)]">
                <span>{diffHz.toFixed(1)} Hz</span>
                <span className="text-sky-400 font-bold">▼</span>
              </div>
            )
          ) : (
            <div className="px-3.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-500 text-xs font-mono">
              드럼 타격 대기 중
            </div>
          )}
        </div>

        {/* Harmonics / Overtones Pins Row (배음 표기 및 목표 도달 시 색상 변경) */}
        {hasSignal && (
          <div className="flex items-center gap-1.5 mt-2">
            {/* 기저음 핀 */}
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${isSubInTune
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800'
                }`}
            >
              기저 ↓ {subHz.toFixed(0)}Hz
            </span>

            {/* 5도 배음 핀 */}
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${isFifthInTune
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800'
                }`}
            >
              5도 ↑ {fifthHz.toFixed(0)}Hz
            </span>

            {/* 오버톤 배음 핀 */}
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${isOvertoneInTune
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800'
                }`}
            >
              오버톤 ↑ {overtoneHz.toFixed(0)}Hz
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
