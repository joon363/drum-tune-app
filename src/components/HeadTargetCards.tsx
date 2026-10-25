import React from 'react';
import { DrumItem, TuningTargetHead, TuningMode } from '../types';
import { frequencyToNote } from '../utils/audioMath';

interface HeadTargetCardsProps {
  drum: DrumItem;
  targetHead: TuningTargetHead;
  tuningMode: TuningMode;
  onSelectHead: (head: TuningTargetHead) => void;
  onSelectMode: (mode: TuningMode) => void;
  onToggleCompleted: (head: TuningTargetHead, mode: TuningMode) => void;
}

export const HeadTargetCards: React.FC<HeadTargetCardsProps> = ({
  drum,
  targetHead,
  tuningMode,
  onSelectHead,
  onSelectMode,
  onToggleCompleted,
}) => {
  const isTopActive = targetHead === 'top';
  const isBottomActive = targetHead === 'bottom';
  const completed = drum.completedTuning || {};

  return (
    <div className="w-full max-w-sm px-3 grid grid-cols-2 gap-2.5 my-1 select-none flex-shrink-0">
      {/* Left Card: 윗면 (Batter Head) */}
      <div
        onClick={() => onSelectHead('top')}
        className={`cursor-pointer rounded-xl p-2.5 flex flex-col justify-between border-2 transition ${
          isTopActive
            ? 'bg-slate-900 border-cyan-400'
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="w-full space-y-1">
          {/* 윗면 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('top');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition border ${
              completed.topFundamental
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : isTopActive && tuningMode === 'fundamental'
                ? 'bg-slate-800 border-slate-600'
                : 'border-transparent hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isTopActive && tuningMode === 'fundamental' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              <span className={`text-xs ${completed.topFundamental ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                중앙
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1 ${
                  completed.topFundamental
                    ? 'text-emerald-300'
                    : 'text-white'
                }`}
              >
                <span className={completed.topFundamental ? 'text-emerald-400' : 'text-cyan-300'}>
                  {frequencyToNote(drum.targetFundamentalHz).fullName}
                </span>
                <span>{drum.targetFundamentalHz.toFixed(0)}Hz</span>
              </span>

              {/* Checkbox Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('top', 'fundamental');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                  completed.topFundamental
                    ? 'bg-emerald-600 border-emerald-400 text-white font-black text-xs'
                    : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-400'
                }`}
                title={completed.topFundamental ? '튜닝완료 취소' : '튜닝완료 표시'}
              >
                ✓
              </button>
            </div>
          </div>

          {/* 윗면 러그 (Lug) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('top');
              onSelectMode('lug');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition border ${
              completed.topLug
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : isTopActive && tuningMode === 'lug'
                ? 'bg-slate-800 border-slate-600'
                : 'border-transparent hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isTopActive && tuningMode === 'lug' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              <span className={`text-xs ${completed.topLug ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                러그
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1 ${
                  completed.topLug
                    ? 'text-emerald-300'
                    : 'text-white'
                }`}
              >
                <span className={completed.topLug ? 'text-emerald-400' : 'text-cyan-300'}>
                  {frequencyToNote(drum.targetTopLugHz).fullName}
                </span>
                <span>{drum.targetTopLugHz.toFixed(0)}Hz</span>
              </span>

              {/* Checkbox Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('top', 'lug');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                  completed.topLug
                    ? 'bg-emerald-600 border-emerald-400 text-white font-black text-xs'
                    : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-400'
                }`}
                title={completed.topLug ? '튜닝완료 취소' : '튜닝완료 표시'}
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        {/* Head Label (글씨 크기 작게, 파트별 명칭) */}
        <div className="mt-1.5 text-center">
          <span
            className={`text-[11px] font-bold tracking-wider uppercase ${
              isTopActive ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            {drum.type === 'bass' ? '타격면' : drum.type === 'snare' ? '타격면' : '윗면'}
          </span>
        </div>
      </div>

      {/* Right Card: 아랫면 (Resonant Head) */}
      <div
        onClick={() => onSelectHead('bottom')}
        className={`cursor-pointer rounded-xl p-2.5 flex flex-col justify-between border-2 transition ${
          isBottomActive
            ? 'bg-slate-900 border-cyan-400'
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="w-full space-y-1">
          {/* 아랫면 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('bottom');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition border ${
              completed.bottomFundamental
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : isBottomActive && tuningMode === 'fundamental'
                ? 'bg-slate-800 border-slate-600'
                : 'border-transparent hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isBottomActive && tuningMode === 'fundamental' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              <span className={`text-xs ${completed.bottomFundamental ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                중앙
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1 ${
                  completed.bottomFundamental
                    ? 'text-emerald-300'
                    : 'text-white'
                }`}
              >
                <span className={completed.bottomFundamental ? 'text-emerald-400' : 'text-cyan-300'}>
                  {frequencyToNote(drum.targetFundamentalHz).fullName}
                </span>
                <span>{drum.targetFundamentalHz.toFixed(0)}Hz</span>
              </span>

              {/* Checkbox Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('bottom', 'fundamental');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                  completed.bottomFundamental
                    ? 'bg-emerald-600 border-emerald-400 text-white font-black text-xs'
                    : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-400'
                }`}
                title={completed.bottomFundamental ? '튜닝완료 취소' : '튜닝완료 표시'}
              >
                ✓
              </button>
            </div>
          </div>

          {/* 아랫면 러그 (Lug) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('bottom');
              onSelectMode('lug');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition border ${
              completed.bottomLug
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : isBottomActive && tuningMode === 'lug'
                ? 'bg-slate-800 border-slate-600'
                : 'border-transparent hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isBottomActive && tuningMode === 'lug' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              <span className={`text-xs ${completed.bottomLug ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                러그
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1 ${
                  completed.bottomLug
                    ? 'text-emerald-300'
                    : 'text-white'
                }`}
              >
                <span className={completed.bottomLug ? 'text-emerald-400' : 'text-cyan-300'}>
                  {frequencyToNote(drum.targetBottomLugHz).fullName}
                </span>
                <span>{drum.targetBottomLugHz.toFixed(0)}Hz</span>
              </span>

              {/* Checkbox Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('bottom', 'lug');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                  completed.bottomLug
                    ? 'bg-emerald-600 border-emerald-400 text-white font-black text-xs'
                    : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-400'
                }`}
                title={completed.bottomLug ? '튜닝완료 취소' : '튜닝완료 표시'}
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        {/* Head Label (글씨 크기 작게, 파트별 명칭) */}
        <div className="mt-1.5 text-center">
          <span
            className={`text-[11px] font-bold tracking-wider uppercase ${
              isBottomActive ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            {drum.type === 'bass' ? '전면' : drum.type === 'snare' ? '스네어사이드' : '아랫면'}
          </span>
        </div>
      </div>
    </div>
  );
};
