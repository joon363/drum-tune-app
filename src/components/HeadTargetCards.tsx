import React from 'react';
import { Check } from 'lucide-react';
import { DrumItem, TuningTargetHead, DetectedPitchInfo } from '../types';
import { frequencyToNote } from '../utils/audioMath';

interface HeadTargetCardsProps {
  drum: DrumItem;
  targetHead: TuningTargetHead;
  onSelectHead: (head: TuningTargetHead) => void;
  onToggleCompleted: (head: TuningTargetHead) => void;
  detectedPitch: DetectedPitchInfo | null;
}

export const HeadTargetCards: React.FC<HeadTargetCardsProps> = ({
  drum,
  targetHead,
  onSelectHead,
  onToggleCompleted,
  detectedPitch,
}) => {
  const isTopActive = targetHead === 'top';
  const isBottomActive = targetHead === 'bottom';
  const completed = drum.completedTuning || {};

  const topTitle = drum.type === 'bass' ? '타격면' : drum.type === 'snare' ? '타격면' : '윗면';
  const bottomTitle = drum.type === 'bass' ? '전면' : drum.type === 'snare' ? '스네어사이드' : '아랫면';

  const topNote = frequencyToNote(drum.targetTopLugHz).fullName;
  const bottomNote = frequencyToNote(drum.targetBottomLugHz).fullName;

  // Real-time detection across fundamental and harmonics
  const currentHz = detectedPitch?.frequency ?? 0;
  const hasSignal = currentHz > 20;
  const subHz = detectedPitch?.subharmonicHz ?? (hasSignal ? currentHz * 0.5 : 0);
  const fifthHz = detectedPitch?.fifthHarmonicHz ?? (hasSignal ? currentHz * 1.5 : 0);
  const overtoneHz = detectedPitch?.overtoneHz ?? (hasSignal ? currentHz * 1.62 : 0);

  // Top lug match detection (Direct or via Harmonics)
  const isTopDirectMatch = hasSignal && Math.abs(currentHz - drum.targetTopLugHz) <= 2.5;
  const isTopSubMatch = hasSignal && Math.abs(subHz - drum.targetTopLugHz) <= 2.5;
  const isTopFifthMatch = hasSignal && Math.abs(fifthHz - drum.targetTopLugHz) <= 2.5;
  const isTopOvertoneMatch = hasSignal && Math.abs(overtoneHz - drum.targetTopLugHz) <= 2.5;
  const isTopInTune = isTopDirectMatch || isTopSubMatch || isTopFifthMatch || isTopOvertoneMatch;

  // Bottom lug match detection (Direct or via Harmonics)
  const isBottomDirectMatch = hasSignal && Math.abs(currentHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomSubMatch = hasSignal && Math.abs(subHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomFifthMatch = hasSignal && Math.abs(fifthHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomOvertoneMatch = hasSignal && Math.abs(overtoneHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomInTune = isBottomDirectMatch || isBottomSubMatch || isBottomFifthMatch || isBottomOvertoneMatch;

  return (
    <div className="w-full max-w-sm px-3 grid grid-cols-2 gap-2.5 my-1 select-none flex-shrink-0">
      {/* Card 1: 윗면 러그 (Batter Lug) - Compact Integrated Row */}
      <div
        onClick={() => onSelectHead('top')}
        className={`cursor-pointer rounded-2xl px-3 py-2 flex items-center justify-between transition-colors duration-150 border ${
          isTopInTune
            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
            : isTopActive
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold tracking-wide ${
                isTopInTune ? 'text-emerald-300' : isTopActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {topTitle} 러그
            </span>
            {isTopInTune && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
            {isTopActive && !isTopInTune && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </div>

          <div className="flex items-baseline gap-1 font-mono mt-0.5">
            <span
              className={`text-base font-black ${
                isTopInTune ? 'text-emerald-300' : isTopActive ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {topNote}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {drum.targetTopLugHz.toFixed(0)}Hz
            </span>
          </div>
        </div>

        {/* Integrated Checkmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompleted('top');
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition active:scale-90 ${
            completed.topLug
              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-slate-800/80 border-slate-700 text-transparent hover:border-slate-500'
          }`}
          title={completed.topLug ? '튜닝완료 취소' : '튜닝완료 표시'}
        >
          <Check size={13} strokeWidth={3.5} />
        </button>
      </div>

      {/* Card 2: 아랫면 러그 (Resonant Lug) - Compact Integrated Row */}
      <div
        onClick={() => onSelectHead('bottom')}
        className={`cursor-pointer rounded-2xl px-3 py-2 flex items-center justify-between transition-colors duration-150 border ${
          isBottomInTune
            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
            : isBottomActive
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold tracking-wide ${
                isBottomInTune ? 'text-emerald-300' : isBottomActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {bottomTitle} 러그
            </span>
            {isBottomInTune && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
            {isBottomActive && !isBottomInTune && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </div>

          <div className="flex items-baseline gap-1 font-mono mt-0.5">
            <span
              className={`text-base font-black ${
                isBottomInTune ? 'text-emerald-300' : isBottomActive ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {bottomNote}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {drum.targetBottomLugHz.toFixed(0)}Hz
            </span>
          </div>
        </div>

        {/* Integrated Checkmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompleted('bottom');
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition active:scale-90 ${
            completed.bottomLug
              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-slate-800/80 border-slate-700 text-transparent hover:border-slate-500'
          }`}
          title={completed.bottomLug ? '튜닝완료 취소' : '튜닝완료 표시'}
        >
          <Check size={13} strokeWidth={3.5} />
        </button>
      </div>
    </div>
  );
};
