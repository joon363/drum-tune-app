import React from 'react';
import { DrumItem } from '../types';

interface DrumKitViewProps {
  drums: DrumItem[];
  selectedDrumId: string;
  onSelectDrum: (drum: DrumItem) => void;
  onOpenDrumSettings: (drum: DrumItem) => void;
}

export const DrumKitView: React.FC<DrumKitViewProps> = ({
  drums,
  selectedDrumId,
  onSelectDrum,
  onOpenDrumSettings,
}) => {
  const handleDrumClick = (drum: DrumItem) => {
    if (drum.id === selectedDrumId) {
      // Second click opens settings modal
      onOpenDrumSettings(drum);
    } else {
      // First click selects drum
      onSelectDrum(drum);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 max-w-md relative flex items-center justify-center p-2 select-none">
      {/* Drum Stage Surface */}
      <div className="relative w-full h-full max-h-[350px] aspect-[4/3.7] bg-slate-950/90 rounded-3xl border border-slate-800/80 p-2 overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Drums Layout */}
        {drums.map((drum) => {
          const isSelected = drum.id === selectedDrumId;
          const isSnare = drum.type === 'snare';
          const isKick = drum.type === 'bass';

          return (
            <div
              key={drum.id}
              onClick={() => handleDrumClick(drum)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform duration-150 active:scale-95"
              style={{
                left: `${drum.x}%`,
                top: `${drum.y}%`,
                width: `${drum.radius * 2}px`,
                height: `${drum.radius * 2}px`,
              }}
            >
              {/* Outer Glow Halo for Selected Drum (Calm and solid) */}
              {isSelected && (
                <div className="absolute -inset-1.5 rounded-full border-2 border-cyan-400/90 shadow-[0_0_12px_rgba(6,182,212,0.4)] pointer-events-none" />
              )}

              {/* Drum Shell Outer Rim */}
              <div
                className={`w-full h-full rounded-full flex flex-col items-center justify-center relative border-2 transition-all duration-200 ${isSelected
                    ? 'border-cyan-400 bg-slate-900 shadow-lg'
                    : isKick
                      ? 'border-rose-600/70 bg-slate-900/90 hover:border-rose-500'
                      : isSnare
                        ? 'border-amber-500/70 bg-slate-900/90 hover:border-amber-400'
                        : 'border-slate-700/80 bg-slate-900/90 hover:border-slate-500'
                  }`}
              >
                {/* Inner Drum Head */}
                <div
                  className={`w-[85%] h-[85%] rounded-full flex flex-col items-center justify-center transition-all ${isSelected
                      ? 'bg-cyan-950/40 border border-cyan-500/50'
                      : isKick
                        ? 'bg-rose-950/30 border border-rose-900/50'
                        : isSnare
                          ? 'bg-amber-950/30 border border-amber-900/50'
                          : 'bg-slate-950 border border-slate-800'
                    }`}
                >
                  {/* Drum Label */}
                  <span
                    className={`font-mono font-black tracking-tight leading-none ${isKick
                        ? 'text-rose-400'
                        : isSnare
                          ? 'text-amber-400'
                          : isSelected
                            ? 'text-cyan-300'
                            : 'text-slate-100'
                      }`}
                    style={{ fontSize: `${Math.max(14, drum.radius * 0.45)}px` }}
                  >
                    {drum.label}
                  </span>

                  {/* Target Note / Frequency */}
                  <div
                    className="font-mono text-center flex flex-col items-center mt-0.5 leading-tight pointer-events-none"
                    style={{ fontSize: `${Math.max(8, drum.radius * 0.22)}px` }}
                  >
                    <span className="font-bold text-slate-300">{drum.targetFundamentalNote}</span>
                    <span className="text-slate-400 scale-90">{drum.targetFundamentalHz.toFixed(0)}Hz</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Minimal Bottom Guide Pill */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <span className="text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 shadow flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>두번 터치해 세부 설정</span>
          </span>
        </div>
      </div>
    </div>
  );
};
