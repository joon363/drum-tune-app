import React, { useState } from 'react';
import { X, Check, Music, Layers, Sliders, Disc, Activity } from 'lucide-react';
import { ResonanceType, HeadBias, TuningGuidePreset } from '../types';
import {
  TUNING_PRESETS,
  BASS_DRUM_RECOMMENDATIONS,
} from '../constants/tuningGuide';
import { frequencyToNote } from '../utils/audioMath';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalResonance: ResonanceType;
  globalHeadBias: HeadBias;
  onUpdateGlobalResonance: (res: ResonanceType, bias: HeadBias, applyToAll: boolean) => void;
  onApplyPreset: (presetId: string) => void;
  onSetKitSize: (numToms: number) => void;
  onApplyKickRecommendation?: (rec: {
    size: number;
    fundamentalNote: string;
    fundamentalHz: number;
    batterLugHz: number;
    resonantLugHz: number;
  }) => void;
  currentNumToms: number;
  smoothingDurationSec?: number;
  onUpdateSmoothingDurationSec?: (durationSec: number) => void;
  smoothingWindow?: number;
  onUpdateSmoothingWindow?: (windowSize: number) => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
  globalResonance,
  globalHeadBias,
  onUpdateGlobalResonance,
  onApplyPreset,
  onSetKitSize,
  onApplyKickRecommendation,
  currentNumToms,
  smoothingDurationSec = 1.0,
  onUpdateSmoothingDurationSec,
  smoothingWindow,
  onUpdateSmoothingWindow,
}) => {
  const [selectedRes, setSelectedRes] = useState<ResonanceType>(globalResonance);
  const [selectedBias, setSelectedBias] = useState<HeadBias>(globalHeadBias);
  const initialDuration = smoothingDurationSec ?? (smoothingWindow ? (smoothingWindow > 2 ? 1.0 : smoothingWindow) : 1.0);
  const [selectedDurationSec, setSelectedDurationSec] = useState<number>(initialDuration);
  const [activeTab, setActiveTab] = useState<'chord' | 'kit' | 'resonance' | 'speed' | 'kick'>('chord');
  const [presetToConfirm, setPresetToConfirm] = useState<TuningGuidePreset | null>(null);

  if (!isOpen) return null;

  const handleSaveResonance = () => {
    onUpdateGlobalResonance(selectedRes, selectedBias, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[85vh] max-h-[680px]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-2.5 py-1.5 gap-1.5 overflow-x-auto scrollbar-none touch-pan-x flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chord')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${activeTab === 'chord'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Music size={14} />
            프리셋
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resonance')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${activeTab === 'resonance'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Sliders size={14} />
            공명
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speed')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${activeTab === 'speed'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Activity size={14} />
            반응속도
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kick')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${activeTab === 'kick'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Disc size={14} />
            킥 설정
          </button>

        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1 min-h-0">
          {/* TAB 1: Chord & Interval Presets */}
          {activeTab === 'chord' && (
            <div className="space-y-2">
              <div className="space-y-2">
                {TUNING_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition group cursor-pointer"
                    onClick={() => {
                      setPresetToConfirm(preset);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition flex items-center gap-1.5 flex-wrap">
                        <span>{preset.koreanName}</span>
                        {preset.popular ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            ★ {preset.tag}
                          </span>
                        ) : preset.tag ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {preset.tag}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Tom Notes preview + Included Kick & Snare */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {preset.toms.map((t) => (
                        <div
                          key={t.size}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-1.5"
                        >
                          <span className="text-slate-400">{t.size}"</span>
                          <span className="font-bold text-cyan-300">{t.fundamentalNote}</span>
                        </div>
                      ))}
                      <div className="px-2 py-1 rounded-lg bg-amber-950 border border-amber-800 text-xs font-mono flex items-center gap-1">
                        <span className="text-amber-400">14" 스네어</span>
                        <span className="font-bold text-amber-300">3F#</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-rose-950 border border-rose-800 text-xs font-mono flex items-center gap-1">
                        <span className="text-rose-400">22" 킥</span>
                        <span className="font-bold text-rose-300">1D#</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: n기통 Kit Configuration */}
          {activeTab === 'kit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    tomCount: 3,
                    label: '5기통',
                    badge: '표준',
                    desc: '10", 12", 14" 탐 + 22" 킥 + 14" 스네어',
                    popular: true,
                  },
                  {
                    tomCount: 4,
                    label: '6기통',
                    badge: '모던 록/워십',
                    desc: '10", 12", 14", 16" 탐 + 22" 킥 + 14" 스네어',
                    popular: true,
                  },
                  {
                    tomCount: 2,
                    label: '4기통',
                    badge: '빈티지/재즈',
                    desc: '12", 16" 탐 + 22" 킥 + 14" 스네어',
                    popular: false,
                  },
                  {
                    tomCount: 5,
                    label: '7기통',
                    badge: '확장 세트',
                    desc: '8", 10", 12", 14", 16" 탐 + 22" 킥 + 14" 스네어',
                    popular: false,
                  },
                  {
                    tomCount: 6,
                    label: '8기통',
                    badge: '커스텀',
                    desc: '8", 10", 12", 13", 14", 16" 탐 + 22" 킥 + 14" 스네어',
                    popular: false,
                  },
                ].map((item) => (
                  <button
                    key={item.tomCount}
                    type="button"
                    onClick={() => {
                      onSetKitSize(item.tomCount);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border text-left transition ${currentNumToms === item.tomCount
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{item.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 킥 드럼 (Bass Drum) Tuning Guide */}
          {activeTab === 'kick' && (
            <div className="space-y-3">
              <div className="space-y-1.5 overflow-y-auto pr-1">
                {BASS_DRUM_RECOMMENDATIONS.map((rec) => (
                  <div
                    key={`${rec.size}-${rec.fundamentalNote}`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        {rec.size}"
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-xs">{rec.fundamentalNote}</span>
                          <span className="font-mono text-[11px] text-slate-400">({rec.fundamentalHz}Hz)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          타격면: <span className="text-cyan-300 font-semibold">{frequencyToNote(rec.batterLugHz).fullName} ({rec.batterLugHz}Hz)</span> | 전면: <span className="text-amber-300 font-semibold">{frequencyToNote(rec.resonantLugHz).fullName} ({rec.resonantLugHz}Hz)</span>
                        </div>
                      </div>
                    </div>

                    {onApplyKickRecommendation && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyKickRecommendation(rec);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
                      >
                        적용
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Global Resonance Setting */}
          {activeTab === 'resonance' && (
            <div className="space-y-4">

              <div className="space-y-2">
                {[
                  {
                    key: 'max' as ResonanceType,
                    title: '최대 공명',
                    desc: '상/하 러그 피치를 동일하게 튜닝하여 가장 긴 서스테인',
                    ratio: '상단 1.75x / 하단 1.75x',
                  },
                  {
                    key: 'high' as ResonanceType,
                    title: '높은 공명 (추천)',
                    desc: '라이브 공연 등 풍부한 울림이 필요할 때 추천',
                    ratio: '상단 1.5x / 하단 1.85x',
                  },
                  {
                    key: 'medium' as ResonanceType,
                    title: '중간 공명',
                    desc: '자연스럽고 균형 잡힌 톤으로 레코딩에 용이',
                    ratio: '상단 1.4x / 하단 2.0x',
                  },
                  {
                    key: 'low' as ResonanceType,
                    title: '낮은 공명',
                    desc: '빠른 감쇄와 타이트한 사운드. 좁은 공간 또는 스튜디오 작업에 적합',
                    ratio: '상단 1.2x / 하단 2.3x',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setSelectedRes(item.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${selectedRes === item.key
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      <span className="text-[11px] font-mono text-cyan-300 font-semibold">{item.ratio}</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Head Bias */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  기본 헤드 피치 바이어스
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'bottom-higher' as HeadBias, label: '아랫면 높게', desc: '레코딩/안정적' },
                    { key: 'equal' as HeadBias, label: '상/하 동일', desc: '최대 서스테인' },
                    { key: 'top-higher' as HeadBias, label: '윗면 높게', desc: '타격 어택 강조' },
                  ].map((bias) => (
                    <button
                      key={bias.key}
                      type="button"
                      onClick={() => setSelectedBias(bias.key)}
                      className={`p-2 rounded-xl text-center border transition ${selectedBias === bias.key
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                      <div className="text-xs">{bias.label}</div>
                      <div className="text-[10px] text-slate-400">{bias.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveResonance}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  글로벌 공명 설정 적용
                </button>
              </div>
            </div>
          )}

          {/* TAB: 반응 속도 & 슬라이딩 윈도우 설정 (초 단위) */}
          {activeTab === 'speed' && (
            <div className="space-y-3">
              {/* Preset Cards */}
              <div className="space-y-2">
                {[
                  {
                    sec: 0,
                    title: '무지연',
                    badge: '0초',
                    desc: '실시간 즉각 반응',
                    color: 'text-rose-400',
                  },
                  {
                    sec: 0.2,
                    title: '빠름',
                    badge: '0.2초',
                    desc: '빠른 반응 속도',
                    color: 'text-amber-300',
                  },
                  {
                    sec: 0.5,
                    title: '표준',
                    badge: '0.5초 (기본)',
                    desc: '안정적으로 피크 갱신',
                    color: 'text-cyan-300',
                  },
                  {
                    sec: 1.0,
                    title: '안정적 (Slow)',
                    badge: '1초',
                    desc: '느리게 갱신',
                    color: 'text-emerald-300',
                  },
                ].map((item) => (
                  <div
                    key={item.sec}
                    onClick={() => {
                      setSelectedDurationSec(item.sec);
                      onUpdateSmoothingDurationSec?.(item.sec);
                      onUpdateSmoothingWindow?.(item.sec);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${Math.abs(selectedDurationSec - item.sec) < 0.05
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      <span className={`text-[11px] font-mono font-semibold ${item.color}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Fine Slider in Seconds */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">반응 시간</span>
                  <span className="font-mono text-cyan-300 font-bold text-sm">
                    {selectedDurationSec === 0 ? '0초 (무지연)' : `${selectedDurationSec.toFixed(1)}초`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.0}
                  step={0.1}
                  value={selectedDurationSec}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedDurationSec(val);
                    onUpdateSmoothingDurationSec?.(val);
                    onUpdateSmoothingWindow?.(val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer py-1.5"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0초 (무지연)</span>
                  <span>1.0초 (기본)</span>
                  <span>2.0초</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preset Confirmation Dialog Overlay */}
        {presetToConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-700">
                <Music size={22} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  프리셋 적용 확인
                </h4>
                <div className="text-sm font-semibold text-cyan-300">
                  [{presetToConfirm.koreanName}]
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  해당 프리셋의 목표 음정으로 변경합니다.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPresetToConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = presetToConfirm.id;
                    setPresetToConfirm(null);
                    onApplyPreset(id);
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

