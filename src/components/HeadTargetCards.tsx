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
  const isFundActive = targetHead === 'fundamental';
  const isTopActive = targetHead === 'top';
  const isBottomActive = targetHead === 'bottom';
  const completed = drum.completedTuning || {};

  const topTitle = drum.type === 'bass' ? '타격면' : drum.type === 'snare' ? '타격면' : '윗면';
  const bottomTitle = drum.type === 'bass' ? '전면' : drum.type === 'snare' ? '스네어사이드' : '아랫면';

  const fundNote = drum.targetFundamentalNote || frequencyToNote(drum.targetFundamentalHz).fullName;
  const topNote = frequencyToNote(drum.targetTopLugHz).fullName;
  const bottomNote = frequencyToNote(drum.targetBottomLugHz).fullName;

  // Real-time detection across fundamental and harmonics
  const currentHz = detectedPitch?.frequency ?? 0;
  const hasSignal = currentHz > 20;
  const subHz = detectedPitch?.subharmonicHz ?? (hasSignal ? currentHz * 0.5 : 0);
  const fifthHz = detectedPitch?.fifthHarmonicHz ?? (hasSignal ? currentHz * 1.5 : 0);
  const overtoneHz = detectedPitch?.overtoneHz ?? (hasSignal ? currentHz * 1.62 : 0);

  // Fundamental match detection
  const isFundDirectMatch = hasSignal && Math.abs(currentHz - drum.targetFundamentalHz) <= 2.5;
  const isFundSubMatch = hasSignal && Math.abs(subHz - drum.targetFundamentalHz) <= 2.5;
  const isFundFifthMatch = hasSignal && Math.abs(fifthHz - drum.targetFundamentalHz) <= 2.5;
  const isFundOvertoneMatch = hasSignal && Math.abs(overtoneHz - drum.targetFundamentalHz) <= 2.5;
  const isFundInTune = isFundDirectMatch || isFundSubMatch || isFundFifthMatch || isFundOvertoneMatch;
  const isFundCompleted = completed.fundamental ?? completed.topFundamental ?? false;

  // Top lug match detection
  const isTopDirectMatch = hasSignal && Math.abs(currentHz - drum.targetTopLugHz) <= 2.5;
  const isTopSubMatch = hasSignal && Math.abs(subHz - drum.targetTopLugHz) <= 2.5;
  const isTopFifthMatch = hasSignal && Math.abs(fifthHz - drum.targetTopLugHz) <= 2.5;
  const isTopOvertoneMatch = hasSignal && Math.abs(overtoneHz - drum.targetTopLugHz) <= 2.5;
  const isTopInTune = isTopDirectMatch || isTopSubMatch || isTopFifthMatch || isTopOvertoneMatch;

  // Bottom lug match detection
  const isBottomDirectMatch = hasSignal && Math.abs(currentHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomSubMatch = hasSignal && Math.abs(subHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomFifthMatch = hasSignal && Math.abs(fifthHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomOvertoneMatch = hasSignal && Math.abs(overtoneHz - drum.targetBottomLugHz) <= 2.5;
  const isBottomInTune = isBottomDirectMatch || isBottomSubMatch || isBottomFifthMatch || isBottomOvertoneMatch;

  return (
    <div className="w-full max-w-md px-2.5 grid grid-cols-3 gap-2 my-1 select-none flex-shrink-0">
      {/* Card 1: 기본음 */}
      <div
        onClick={() => onSelectHead('fundamental')}
        className={`cursor-pointer rounded-xl px-2.5 py-1.5 flex flex-col justify-between transition-colors duration-150 border ${
          isFundInTune
            ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
            : isFundActive
            ? 'bg-slate-900 border-cyan-500'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold tracking-tight truncate ${
              isFundInTune ? 'text-emerald-300' : isFundActive ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            기본음
          </span>
          {isFundInTune ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          ) : isFundActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1 font-mono leading-none">
            <span
              className={`text-sm font-black ${
                isFundInTune ? 'text-emerald-300' : isFundActive ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {fundNote}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {drum.targetFundamentalHz.toFixed(0)}Hz
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompleted('fundamental');
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center border transition active:scale-90 flex-shrink-0 ml-1 ${
              isFundCompleted
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
            }`}
            title={isFundCompleted ? '튜닝완료 취소' : '튜닝완료 표시'}
          >
            <Check size={11} strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* Card 2: 윗면 러그 */}
      <div
        onClick={() => onSelectHead('top')}
        className={`cursor-pointer rounded-xl px-2.5 py-1.5 flex flex-col justify-between transition-colors duration-150 border ${
          isTopInTune
            ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
            : isTopActive
            ? 'bg-slate-900 border-cyan-500'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold tracking-tight truncate ${
              isTopInTune ? 'text-emerald-300' : isTopActive ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            {topTitle} 러그
          </span>
          {isTopInTune ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          ) : isTopActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1 font-mono leading-none">
            <span
              className={`text-sm font-black ${
                isTopInTune ? 'text-emerald-300' : isTopActive ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {topNote}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {drum.targetTopLugHz.toFixed(0)}Hz
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompleted('top');
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center border transition active:scale-90 flex-shrink-0 ml-1 ${
              completed.topLug
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
            }`}
            title={completed.topLug ? '튜닝완료 취소' : '튜닝완료 표시'}
          >
            <Check size={11} strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* Card 3: 아랫면 러그 */}
      <div
        onClick={() => onSelectHead('bottom')}
        className={`cursor-pointer rounded-xl px-2.5 py-1.5 flex flex-col justify-between transition-colors duration-150 border ${
          isBottomInTune
            ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
            : isBottomActive
            ? 'bg-slate-900 border-cyan-500'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold tracking-tight truncate ${
              isBottomInTune ? 'text-emerald-300' : isBottomActive ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            {bottomTitle} 러그
          </span>
          {isBottomInTune ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          ) : isBottomActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1 font-mono leading-none">
            <span
              className={`text-sm font-black ${
                isBottomInTune ? 'text-emerald-300' : isBottomActive ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {bottomNote}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {drum.targetBottomLugHz.toFixed(0)}Hz
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompleted('bottom');
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center border transition active:scale-90 flex-shrink-0 ml-1 ${
              completed.bottomLug
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
            }`}
            title={completed.bottomLug ? '튜닝완료 취소' : '튜닝완료 표시'}
          >
            <Check size={11} strokeWidth={3.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
