import React, { useState } from 'react';
import { X, Check, Volume2, Sparkles } from 'lucide-react';
import { DrumItem, ResonanceType, HeadBias, DrumType } from '../types';
import { calculateLugFrequencies, NOTE_NAMES, BASE_NOTE_FREQUENCIES } from '../constants/tuningGuide';

interface DrumSettingsModalProps {
  drum: DrumItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DrumItem) => void;
}

const AVAILABLE_SIZES = [8, 10, 12, 13, 14, 15, 16, 18, 20, 22];

export const DrumSettingsModal: React.FC<DrumSettingsModalProps> = ({
  drum,
  isOpen,
  onClose,
  onSave,
}) => {
  const [sizeInches, setSizeInches] = useState<number>(drum.sizeInches);
  const [type, setType] = useState<DrumType>(drum.type);
  const [resonance, setResonance] = useState<ResonanceType>(drum.resonance);
  const [headBias, setHeadBias] = useState<HeadBias>(drum.headBias);
  const [fundamentalHz, setFundamentalHz] = useState<number>(drum.targetFundamentalHz);
  const [fundamentalNote, setFundamentalNote] = useState<string>(drum.targetFundamentalNote);

  if (!isOpen) return null;

  // Recalculate lug targets
  const { topLugHz, bottomLugHz } = calculateLugFrequencies(fundamentalHz, resonance, headBias);

  const handleSizeChange = (newSize: number) => {
    setSizeInches(newSize);
    // Typical fundamental estimation based on size
    let defaultFund = fundamentalHz;
    let defaultNote = fundamentalNote;
    if (newSize === 8) { defaultFund = 208.0; defaultNote = '3G#'; }
    else if (newSize === 10) { defaultFund = 165.0; defaultNote = '3E'; }
    else if (newSize === 12) { defaultFund = 131.0; defaultNote = '3C'; }
    else if (newSize === 13) { defaultFund = 104.0; defaultNote = '2G#'; }
    else if (newSize === 14) { defaultFund = 98.0; defaultNote = '2G'; }
    else if (newSize === 16) { defaultFund = 73.4; defaultNote = '2D'; }
    else if (newSize === 18) { defaultFund = 65.4; defaultNote = '2C'; }

    setFundamentalHz(defaultFund);
    setFundamentalNote(defaultNote);
  };

  const handleNoteSelect = (noteKey: string) => {
    if (BASE_NOTE_FREQUENCIES[noteKey]) {
      setFundamentalNote(noteKey);
      setFundamentalHz(BASE_NOTE_FREQUENCIES[noteKey]);
    }
  };

  const handleSave = () => {
    const updated: DrumItem = {
      ...drum,
      name: `${sizeInches}" ${type === 'snare' ? '스네어' : type === 'floor-tom' ? '플로어 탐' : '랙 탐'}`,
      label: type === 'snare' ? 'S' : `${sizeInches}`,
      sizeInches,
      type,
      resonance,
      headBias,
      targetFundamentalHz: fundamentalHz,
      targetFundamentalNote: fundamentalNote,
      targetTopLugHz: topLugHz,
      targetBottomLugHz: bottomLugHz,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {drum.label} ({drum.sizeInches}인치) 탐 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Drum Type & Inch Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              드럼 종류 및 인치수 (Size)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setType('rack-tom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  type === 'rack-tom'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                랙 탐 (Rack Tom)
              </button>
              <button
                type="button"
                onClick={() => setType('floor-tom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  type === 'floor-tom'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                플로어 탐 (Floor Tom)
              </button>
              <button
                type="button"
                onClick={() => setType('snare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  type === 'snare'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                스네어 (Snare)
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {AVAILABLE_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSizeChange(sz)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    sizeInches === sz
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {sz}"
                </button>
              ))}
            </div>
          </div>

          {/* Resonance Setting (app.md requirement: High / Mid / Low) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              공명 정도 (Resonance)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'max' as ResonanceType, label: '최대 (Max)', sub: '동일 피치' },
                { key: 'high' as ResonanceType, label: '높음 (High)', sub: '긴 서스테인' },
                { key: 'medium' as ResonanceType, label: '중간 (Mid)', sub: '표준 밸런스' },
                { key: 'low' as ResonanceType, label: '낮음 (Low)', sub: '빠른 감쇄' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setResonance(item.key)}
                  className={`p-2 rounded-xl text-center border transition flex flex-col items-center ${
                    resonance === item.key
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Head Bias (Tuning relationship) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              헤드 피치 관계 (Head Relationship)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'bottom-higher' as HeadBias, label: '아랫면 높게', desc: '녹음/제어' },
                { key: 'equal' as HeadBias, label: '상/하 동일', desc: '최대 울림' },
                { key: 'top-higher' as HeadBias, label: '윗면 높게', desc: '강한 어택' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setHeadBias(item.key)}
                  className={`p-1.5 rounded-lg text-center border transition ${
                    headBias === item.key
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-semibold'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[9px] text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fundamental Pitch Target */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">목표 기본음 (Fundamental)</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-mono font-bold text-cyan-300">{fundamentalNote}</span>
                <span className="text-sm font-mono text-slate-400">({fundamentalHz.toFixed(1)}Hz)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="300"
                step="0.5"
                value={fundamentalHz}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFundamentalHz(val);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Quick Note buttons for common drum octaves 2 and 3 */}
            <div className="flex flex-wrap gap-1 mt-2.5 max-h-20 overflow-y-auto pr-1">
              {['2C', '2D', '2E', '2F', '2F#', '2G', '2G#', '2A', '2B', '3C', '3D', '3E', '3F', '3F#', '3G', '3G#', '3A'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNoteSelect(n)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                    fundamentalNote === n
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Output Targets Preview */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-sky-950/30 rounded-xl border border-cyan-900/60">
            <div className="text-center">
              <div className="text-[11px] text-slate-400">윗면 러그 목표</div>
              <div className="font-mono text-lg font-bold text-cyan-300">{topLugHz.toFixed(1)}Hz</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-slate-400">아랫면 러그 목표</div>
              <div className="font-mono text-lg font-bold text-cyan-300">{bottomLugHz.toFixed(1)}Hz</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/25"
          >
            <Check size={16} />
            적용
          </button>
        </div>
      </div>
    </div>
  );
};
