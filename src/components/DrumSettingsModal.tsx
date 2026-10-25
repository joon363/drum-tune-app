import React, { useState, useEffect } from 'react';
import { X, Check, Disc, Volume2 } from 'lucide-react';
import { DrumItem, ResonanceType, HeadBias, DrumType } from '../types';
import {
  calculateLugFrequencies,
  NOTE_NAMES,
  BASE_NOTE_FREQUENCIES,
  BASS_DRUM_RECOMMENDATIONS,
  SNARE_DRUM_RECOMMENDATIONS,
} from '../constants/tuningGuide';
import { frequencyToNote } from '../utils/audioMath';

interface DrumSettingsModalProps {
  drum: DrumItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DrumItem) => void;
}

const TOM_SIZES = [8, 10, 12, 13, 14, 15, 16, 18];
const BASS_SIZES = [18, 20, 22, 24];

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
  const [topLugHzManual, setTopLugHzManual] = useState<number>(drum.targetTopLugHz);
  const [bottomLugHzManual, setBottomLugHzManual] = useState<number>(drum.targetBottomLugHz);
  const [useManualLug, setUseManualLug] = useState<boolean>(drum.type === 'bass');

  // Synchronize state whenever a new drum is passed or modal opens
  useEffect(() => {
    if (isOpen && drum) {
      setSizeInches(drum.sizeInches);
      setType(drum.type);
      setResonance(drum.resonance || 'medium');
      setHeadBias(drum.headBias || 'bottom-higher');
      setFundamentalHz(drum.targetFundamentalHz);
      setFundamentalNote(drum.targetFundamentalNote);
      setTopLugHzManual(drum.targetTopLugHz);
      setBottomLugHzManual(drum.targetBottomLugHz);
      setUseManualLug(drum.type === 'bass' || drum.type === 'snare');
    }
  }, [drum, isOpen]);

  if (!isOpen) return null;

  // Calculate lug targets for toms
  const autoLugs = calculateLugFrequencies(fundamentalHz, resonance, headBias);
  const topLugHz = useManualLug ? topLugHzManual : autoLugs.topLugHz;
  const bottomLugHz = useManualLug ? bottomLugHzManual : autoLugs.bottomLugHz;

  const handleTypeChange = (newType: DrumType) => {
    setType(newType);
    if (newType === 'bass') {
      setSizeInches(22);
      setFundamentalNote('1D#');
      setFundamentalHz(38.9);
      setTopLugHzManual(58.0);
      setBottomLugHzManual(87.0);
      setUseManualLug(true);
    } else if (newType === 'snare') {
      setSizeInches(14); // 14" 표준 고정
      setFundamentalNote('3F#');
      setFundamentalHz(185.0);
      setTopLugHzManual(252.0);
      setBottomLugHzManual(378.0);
      setUseManualLug(true);
    } else {
      setUseManualLug(false);
      if (newType === 'floor-tom' && sizeInches < 14) {
        setSizeInches(14);
        setFundamentalHz(98.0);
        setFundamentalNote('2G');
      }
    }
  };

  const handleSizeChange = (newSize: number) => {
    setSizeInches(newSize);
    if (type === 'bass') {
      const match = BASS_DRUM_RECOMMENDATIONS.find((b) => b.size === newSize);
      if (match) {
        setFundamentalHz(match.fundamentalHz);
        setFundamentalNote(match.fundamentalNote);
        setTopLugHzManual(match.batterLugHz);
        setBottomLugHzManual(match.resonantLugHz);
        setUseManualLug(true);
      }
    } else if (type === 'snare') {
      // Snare is fixed at 14"
      setSizeInches(14);
    } else {
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
      setUseManualLug(false);
    }
  };

  const handleNoteSelect = (noteKey: string) => {
    if (BASE_NOTE_FREQUENCIES[noteKey]) {
      setFundamentalNote(noteKey);
      setFundamentalHz(BASE_NOTE_FREQUENCIES[noteKey]);
      setUseManualLug(false);
    }
  };

  const handleApplyBassRec = (rec: typeof BASS_DRUM_RECOMMENDATIONS[0]) => {
    setSizeInches(rec.size);
    setFundamentalHz(rec.fundamentalHz);
    setFundamentalNote(rec.fundamentalNote);
    setTopLugHzManual(rec.batterLugHz);
    setBottomLugHzManual(rec.resonantLugHz);
    setUseManualLug(true);
  };

  const handleApplySnareRec = (rec: typeof SNARE_DRUM_RECOMMENDATIONS[0]) => {
    setSizeInches(14);
    setFundamentalHz(rec.fundamentalHz);
    setFundamentalNote(rec.fundamentalNote);
    setTopLugHzManual(rec.topLugHz);
    setBottomLugHzManual(rec.bottomLugHz);
    setUseManualLug(true);
  };

  const handleSave = () => {
    const updated: DrumItem = {
      ...drum,
      name:
        type === 'snare'
          ? '14" 스네어'
          : type === 'bass'
            ? `${sizeInches}" 킥 드럼`
            : type === 'floor-tom'
              ? `${sizeInches}" 플로어 탐`
              : `${sizeInches}" 랙 탐`,
      label: type === 'snare' ? 'S' : type === 'bass' ? 'K' : `${sizeInches}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${type === 'bass'
                ? 'bg-rose-400'
                : type === 'snare'
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
                }`}
            />
            <h3 className="text-base font-bold text-white tracking-tight">
              {drum.label} ({drum.sizeInches}인치) {type === 'bass' ? '킥 드럼' : type === 'snare' ? '스네어' : '탐'} 설정
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1 min-h-0">
          {/* Drum Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              드럼 파트 선택
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => handleTypeChange('rack-tom')}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${type === 'rack-tom'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
              >
                랙 탐
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('floor-tom')}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${type === 'floor-tom'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
              >
                플로어 탐
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('snare')}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${type === 'snare'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
              >
                스네어
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('bass')}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${type === 'bass'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
              >
                킥 드럼
              </button>
            </div>

            {/* Inch Size Selector */}
            <div className="text-xs text-slate-400 mb-1">
              직경: {type === 'snare' ? <span className="text-amber-300 font-semibold">14" 표준 고정</span> : null}
            </div>
            {type === 'snare' ? (
              <div className="p-2 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200">
                스네어는 통상 14인치가 고정 표준입니다.
              </div>
            ) : type === 'bass' ? (
              <div className="grid grid-cols-4 gap-1.5">
                {BASS_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeChange(sz)}
                    className={`py-2 rounded-lg text-xs font-mono font-bold border transition ${sizeInches === sz
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                  >
                    {sz}"
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {TOM_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeChange(sz)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${sizeInches === sz
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                  >
                    {sz}"
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide Recommendations for Bass Drum (Page 6) */}
          {type === 'bass' && (
            <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300">
                  {sizeInches}" 킥 드럼 추천 튜닝
                </span>
                <span className="text-[10px] text-slate-400">전면 1.5배(완전5도)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {BASS_DRUM_RECOMMENDATIONS.filter((b) => b.size === sizeInches).map((rec) => (
                  <button
                    key={rec.fundamentalNote}
                    type="button"
                    onClick={() => handleApplyBassRec(rec)}
                    className={`p-2 rounded-lg border text-left transition text-xs font-mono flex items-center justify-between ${fundamentalNote === rec.fundamentalNote
                      ? 'bg-rose-600/30 border-rose-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <div>
                      <span className="font-bold text-rose-300">{rec.fundamentalNote}</span> ({rec.fundamentalHz}Hz)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {frequencyToNote(rec.batterLugHz).fullName} {rec.batterLugHz} / {frequencyToNote(rec.resonantLugHz).fullName} {rec.resonantLugHz}Hz
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Guide Recommendations for Snare Drum (Page 5) */}
          {type === 'snare' && (
            <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  14" 스네어 추천 튜닝
                </span>
                <span className="text-[10px] text-slate-400">완전 5도 비율</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {SNARE_DRUM_RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.fundamentalNote}
                    type="button"
                    onClick={() => handleApplySnareRec(rec)}
                    className={`p-1.5 rounded-lg border text-left transition text-xs font-mono flex flex-col ${fundamentalNote === rec.fundamentalNote
                      ? 'bg-amber-500/30 border-amber-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <span className="font-bold text-amber-300">{rec.fundamentalNote} ({rec.fundamentalHz}Hz)</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {frequencyToNote(rec.topLugHz).fullName} {rec.topLugHz} / {frequencyToNote(rec.bottomLugHz).fullName} {rec.bottomLugHz}Hz
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resonance Setting for Toms */}
          {type !== 'bass' && type !== 'snare' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  공명 정도
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: 'max' as ResonanceType, label: '최대', sub: '동일 피치' },
                    { key: 'high' as ResonanceType, label: '높음', sub: '긴 서스테인' },
                    { key: 'medium' as ResonanceType, label: '중간', sub: '표준 밸런스' },
                    { key: 'low' as ResonanceType, label: '낮음', sub: '빠른 감쇄' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setResonance(item.key);
                        setUseManualLug(false);
                      }}
                      className={`p-2 rounded-xl text-center border transition flex flex-col items-center ${resonance === item.key
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  헤드 피치 관계
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'bottom-higher' as HeadBias, label: '아랫면 높게', desc: '녹음/제어' },
                    { key: 'equal' as HeadBias, label: '상/하 동일', desc: '최대 울림' },
                    { key: 'top-higher' as HeadBias, label: '윗면 높게', desc: '강한 어택' },
                  ].map((bias) => (
                    <button
                      key={bias.key}
                      type="button"
                      onClick={() => {
                        setHeadBias(bias.key);
                        setUseManualLug(false);
                      }}
                      className={`p-1.5 rounded-lg text-center border transition ${headBias === bias.key
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                    >
                      <div className="text-xs">{bias.label}</div>
                      <div className="text-[9px] text-slate-400">{bias.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fundamental Pitch Target Slider & Quick Notes */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">목표 기본음</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-mono font-bold ${type === 'bass' ? 'text-rose-400' : type === 'snare' ? 'text-amber-400' : 'text-cyan-300'}`}>
                  {fundamentalNote}
                </span>
                <span className="text-sm font-mono text-slate-400">({fundamentalHz.toFixed(1)}Hz)</span>
              </div>
            </div>

            <input
              type="range"
              min={type === 'bass' ? 30 : 50}
              max={type === 'bass' ? 70 : 300}
              step="0.5"
              value={fundamentalHz}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFundamentalHz(val);
                setFundamentalNote(frequencyToNote(val).fullName);
                setUseManualLug(false);
              }}
              className="w-full accent-cyan-400 cursor-pointer py-1.5"
            />

            {/* Quick Note Buttons */}
            <div className="flex flex-wrap gap-1 mt-2.5 max-h-20 overflow-y-auto pr-1">
              {(type === 'bass'
                ? ['1C', '1C#', '1D', '1D#', '1E', '1F', '1F#', '1G']
                : ['2C', '2D', '2E', '2F', '2F#', '2G', '2G#', '2A', '2B', '3C', '3D', '3E', '3F', '3F#', '3G', '3G#', '3A']
              ).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNoteSelect(n)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${fundamentalNote === n
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                >
                  <span className="font-bold">{n}</span>
                  <span className="text-[9px] opacity-75">{BASE_NOTE_FREQUENCIES[n]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Output Targets Preview */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-sky-950/30 rounded-xl border border-cyan-900/60">
            <div className="text-center">
              <div className="text-[11px] text-slate-400">
                {type === 'bass' ? '타격면 러그' : type === 'snare' ? '타격면 러그' : '윗면 러그 목표'}
              </div>
              <div className="font-mono text-base font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                <span className="text-amber-300">{frequencyToNote(topLugHz).fullName}</span>
                <span>({topLugHz.toFixed(1)}Hz)</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-slate-400">
                {type === 'bass' ? '전면 러그' : type === 'snare' ? '스네어사이드 러그' : '아랫면 러그 목표'}
              </div>
              <div className="font-mono text-base font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                <span className="text-amber-300">{frequencyToNote(bottomLugHz).fullName}</span>
                <span>({bottomLugHz.toFixed(1)}Hz)</span>
              </div>
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
