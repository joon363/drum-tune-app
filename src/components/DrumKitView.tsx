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
      // Second click opens settings modal (as specified in app.md)
      onOpenDrumSettings(drum);
    } else {
      // First click selects drum
      onSelectDrum(drum);
    }
  };

  return (
    <div className="w-full flex-1 max-w-md relative flex flex-col items-center justify-center p-2 select-none">
      {/* Container with aspect ratio matching drum layout */}
      <div className="relative w-full aspect-[4/4.2] max-h-[380px] bg-slate-950/60 rounded-3xl border border-slate-800/80 p-4 shadow-inner overflow-hidden">
        {/* Subtle stage rug / drum mat circle in background */}
        <div className="absolute inset-4 rounded-full border border-slate-800/40 pointer-events-none opacity-40" />
        <div className="absolute inset-16 rounded-full border border-slate-800/30 pointer-events-none opacity-30" />

        {/* Drums layout based on 배치.png */}
        {drums.map((drum) => {
          const isSelected = drum.id === selectedDrumId;
          const isSnare = drum.type === 'snare';

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
              {/* Outer Selection Highlight Ring (front.png double ring) */}
              {isSelected && (
                <div
                  className="absolute -inset-2 rounded-full border-2 border-cyan-400 pointer-events-none"
                />
              )}

              {/* Drum Shell Outer Rim / Hoop */}
              <div
                className={`w-full h-full rounded-full flex flex-col items-center justify-center relative border-2 ${isSelected
                  ? 'border-cyan-400 bg-slate-900'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                  }`}
              >
                {/* Simulated Lug Screws along rim */}
                <div className="absolute -top-1 w-2 h-1 bg-slate-500 rounded-sm" />
                <div className="absolute -bottom-1 w-2 h-1 bg-slate-500 rounded-sm" />
                <div className="absolute -left-1 w-1 h-2 bg-slate-500 rounded-sm" />
                <div className="absolute -right-1 w-1 h-2 bg-slate-500 rounded-sm" />

                {/* Inner Drum Head (Skin) */}
                <div
                  className={`w-[84%] h-[84%] rounded-full flex flex-col items-center justify-center border ${isSelected
                    ? 'bg-slate-950 border-cyan-500/80'
                    : isSnare
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900 border-slate-700'
                    }`}
                >
                  {/* Drum Label (8, 10, 12, S, 14, 16) */}
                  <span
                    className={`font-mono font-extrabold tracking-tight transition-colors ${isSnare ? 'text-amber-400' : isSelected ? 'text-cyan-300' : 'text-slate-200'
                      }`}
                    style={{ fontSize: `${Math.max(16, drum.radius * 0.46)}px` }}
                  >
                    {drum.label}
                  </span>

                  {/* Target Note / Hz subtext */}
                  <span
                    className="font-mono text-[9px] text-slate-400 leading-tight"
                    style={{ fontSize: `${Math.max(8, drum.radius * 0.22)}px` }}
                  >
                    {drum.targetFundamentalNote}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Small tooltip / guide at bottom of kit area */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 shadow">
            탐탐 <span className="text-cyan-400 font-semibold">한 번 더 터치</span>해 상세설정
          </span>
        </div>
      </div>
    </div>
  );
};
