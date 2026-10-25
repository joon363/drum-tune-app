import React from 'react';
import { DrumItem, TuningTargetHead, TuningMode } from '../types';

interface HeadTargetCardsProps {
  drum: DrumItem;
  targetHead: TuningTargetHead;
  tuningMode: TuningMode;
  onSelectHead: (head: TuningTargetHead) => void;
  onSelectMode: (mode: TuningMode) => void;
}

export const HeadTargetCards: React.FC<HeadTargetCardsProps> = ({
  drum,
  targetHead,
  tuningMode,
  onSelectHead,
  onSelectMode,
}) => {
  const isTopActive = targetHead === 'top';
  const isBottomActive = targetHead === 'bottom';

  return (
    <div className="w-full max-w-sm px-4 grid grid-cols-2 gap-3 my-2 select-none">
      {/* Left Card: 윗면 (Batter Head) */}
      <div
        onClick={() => onSelectHead('top')}
        className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-between transition-all duration-200 border-2 ${
          isTopActive
            ? 'bg-gradient-to-b from-sky-950/70 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-[1.02]'
            : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <div className="w-full space-y-1 text-sm font-sans">
          {/* 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('top');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isTopActive && tuningMode === 'fundamental'
                ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                : 'hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-slate-300">중앙</span>
            <span className="font-mono text-base font-bold text-white">
              {drum.targetFundamentalHz.toFixed(0)}Hz
            </span>
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
                ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                : 'hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-slate-300">러그</span>
            <span className="font-mono text-base font-bold text-cyan-300">
              {drum.targetTopLugHz.toFixed(0)}Hz
            </span>
          </div>
        </div>

        {/* Head Label */}
        <div className="mt-2 text-center">
          <span
            className={`text-lg font-bold tracking-tight ${
              isTopActive ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-slate-400'
            }`}
          >
            윗면
          </span>
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Batter Head</span>
        </div>
      </div>

      {/* Right Card: 아랫면 (Resonant Head) */}
      <div
        onClick={() => onSelectHead('bottom')}
        className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-between transition-all duration-200 border-2 ${
          isBottomActive
            ? 'bg-gradient-to-b from-sky-950/70 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-[1.02]'
            : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <div className="w-full space-y-1 text-sm font-sans">
          {/* 중앙 (Fundamental) row */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectHead('bottom');
              onSelectMode('fundamental');
            }}
            className={`flex items-center justify-between px-2 py-1 rounded transition ${
              isBottomActive && tuningMode === 'fundamental'
                ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                : 'hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-slate-300">중앙</span>
            <span className="font-mono text-base font-bold text-white">
              {drum.targetFundamentalHz.toFixed(0)}Hz
            </span>
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
                ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                : 'hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-slate-300">러그</span>
            <span className="font-mono text-base font-bold text-cyan-300">
              {drum.targetBottomLugHz.toFixed(0)}Hz
            </span>
          </div>
        </div>

        {/* Head Label */}
        <div className="mt-2 text-center">
          <span
            className={`text-lg font-bold tracking-tight ${
              isBottomActive ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-slate-400'
            }`}
          >
            아랫면
          </span>
          <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Resonant Head</span>
        </div>
      </div>
    </div>
  );
};
