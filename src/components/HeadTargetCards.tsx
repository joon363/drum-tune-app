import React from 'react';
import { DrumItem, TuningTargetHead, TuningMode } from '../types';

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
    <div className="w-full max-w-sm px-4 grid grid-cols-2 gap-3 my-2 select-none">
      {/* Left Card: 윗면 (Batter Head) */}
      <div
        onClick={() => onSelectHead('top')}
        className={`cursor-pointer rounded-xl p-2.5 flex flex-col items-center justify-between border-2 transition ${
          isTopActive
            ? 'bg-slate-900 border-cyan-400'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
        }`}
      >
        <div className="w-full space-y-1.5 text-sm font-sans">
          {/* 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('top');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isTopActive && tuningMode === 'fundamental'
                ? 'bg-cyan-950 text-cyan-200 font-bold border border-cyan-500'
                : 'hover:bg-slate-850'
            }`}
          >
            <span className="text-xs text-slate-400">중앙</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-white">
                {drum.targetFundamentalHz.toFixed(0)}Hz
              </span>
              {/* Check button for 튜닝완료 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('top', 'fundamental');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] font-bold transition ${
                  completed.topFundamental
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-600 border-slate-700 hover:border-slate-500 hover:text-slate-400'
                }`}
                title={completed.topFundamental ? '튜닝완료 취소' : '튜닝완료 체크'}
              >
                ✓
              </button>
            </div>
          </div>

          {/* 러그 (Lug) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('top');
              onSelectMode('lug');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isTopActive && tuningMode === 'lug'
                ? 'bg-cyan-950 text-cyan-200 font-bold border border-cyan-500'
                : 'hover:bg-slate-850'
            }`}
          >
            <span className="text-xs text-slate-400">러그</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {drum.targetTopLugHz.toFixed(0)}Hz
              </span>
              {/* Check button for 튜닝완료 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('top', 'lug');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] font-bold transition ${
                  completed.topLug
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-600 border-slate-700 hover:border-slate-500 hover:text-slate-400'
                }`}
                title={completed.topLug ? '튜닝완료 취소' : '튜닝완료 체크'}
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        {/* Head Label (윗면 글씨 축소) */}
        <div className="mt-1.5 text-center">
          <span
            className={`text-xs font-semibold tracking-wide ${
              isTopActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            윗면
          </span>
          <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Batter Head</span>
        </div>
      </div>

      {/* Right Card: 아랫면 (Resonant Head) */}
      <div
        onClick={() => onSelectHead('bottom')}
        className={`cursor-pointer rounded-xl p-2.5 flex flex-col items-center justify-between border-2 transition ${
          isBottomActive
            ? 'bg-slate-900 border-cyan-400'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
        }`}
      >
        <div className="w-full space-y-1.5 text-sm font-sans">
          {/* 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('bottom');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isBottomActive && tuningMode === 'fundamental'
                ? 'bg-cyan-950 text-cyan-200 font-bold border border-cyan-500'
                : 'hover:bg-slate-850'
            }`}
          >
            <span className="text-xs text-slate-400">중앙</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-white">
                {drum.targetFundamentalHz.toFixed(0)}Hz
              </span>
              {/* Check button for 튜닝완료 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('bottom', 'fundamental');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] font-bold transition ${
                  completed.bottomFundamental
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-600 border-slate-700 hover:border-slate-500 hover:text-slate-400'
                }`}
                title={completed.bottomFundamental ? '튜닝완료 취소' : '튜닝완료 체크'}
              >
                ✓
              </button>
            </div>
          </div>

          {/* 러그 (Lug) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('bottom');
              onSelectMode('lug');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isBottomActive && tuningMode === 'lug'
                ? 'bg-cyan-950 text-cyan-200 font-bold border border-cyan-500'
                : 'hover:bg-slate-850'
            }`}
          >
            <span className="text-xs text-slate-400">러그</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {drum.targetBottomLugHz.toFixed(0)}Hz
              </span>
              {/* Check button for 튜닝완료 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompleted('bottom', 'lug');
                }}
                className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] font-bold transition ${
                  completed.bottomLug
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-600 border-slate-700 hover:border-slate-500 hover:text-slate-400'
                }`}
                title={completed.bottomLug ? '튜닝완료 취소' : '튜닝완료 체크'}
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        {/* Head Label (아랫면 글씨 축소) */}
        <div className="mt-1.5 text-center">
          <span
            className={`text-xs font-semibold tracking-wide ${
              isBottomActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            아랫면
          </span>
          <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Resonant Head</span>
        </div>
      </div>
    </div>
  );
};
