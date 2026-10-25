import React, { useState } from 'react';
import { X, Check, BookOpen, Music, Layers, Sliders, Disc } from 'lucide-react';
import { ResonanceType, HeadBias, TuningGuidePreset } from '../types';
import {
  TUNING_PRESETS,
  BASS_DRUM_RECOMMENDATIONS,
  SNARE_DRUM_RECOMMENDATIONS,
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
}) => {
  const [selectedRes, setSelectedRes] = useState<ResonanceType>(globalResonance);
  const [selectedBias, setSelectedBias] = useState<HeadBias>(globalHeadBias);
  const [applyToAllDrums, setApplyToAllDrums] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chord' | 'kit' | 'kick' | 'resonance' | 'guide'>('chord');
  const [presetToConfirm, setPresetToConfirm] = useState<TuningGuidePreset | null>(null);

  if (!isOpen) return null;

  const handleSaveResonance = () => {
    onUpdateGlobalResonance(selectedRes, selectedBias, applyToAllDrums);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-sky-950 border-b border-slate-800 flex items-center justify-between">
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
        <div className="flex border-b border-slate-800 bg-slate-950/70 p-1 gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('chord')}
            className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'chord'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
          >
            <Music size={13} />
            프리셋
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kick')}
            className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'kick'
              ? 'bg-rose-500 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
          >
            <Disc size={13} />
            킥 가이드
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resonance')}
            className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'resonance'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
          >
            <Sliders size={13} />
            공명
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'guide'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
          >
            <BookOpen size={13} />
            요약
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* TAB 1: Chord & Interval Presets */}
          {activeTab === 'chord' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 leading-relaxed">
                Tune-Bot 공식 가이드 Table 1 추천 음정 및 화음 프리셋입니다. 원하는 프리셋을 터치하면 자동 전환됩니다.
              </div>

              <div className="space-y-2">
                {TUNING_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 transition group cursor-pointer"
                    onClick={() => {
                      setPresetToConfirm(preset);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                        {preset.koreanName}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {preset.intervalType}
                      </span>
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
                          <span className="text-[10px] text-slate-400">({t.fundamentalHz}Hz)</span>
                        </div>
                      ))}
                      <div className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs font-mono flex items-center gap-1">
                        <span className="text-rose-400">22" 킥</span>
                        <span className="font-bold text-rose-300">1D#</span>
                        <span className="text-[10px] text-rose-400">(38.9Hz)</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs font-mono flex items-center gap-1">
                        <span className="text-amber-400">14" 스네어</span>
                        <span className="font-bold text-amber-300">3F#</span>
                        <span className="text-[10px] text-amber-400">(185Hz)</span>
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
              <div className="text-xs text-slate-400 leading-relaxed">
                내 드럼 세트의 기통수를 선택합니다. <strong className="text-cyan-300">탐 개수 + 킥 1개 = 총 기통수</strong>이며, 14" 표준 스네어와 22" 킥 드럼이 항상 기본 포함되어 실제 연주 세팅과 완벽히 일치합니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    tomCount: 6,
                    label: '7기통 (6탐 + 킥)',
                    badge: '6탐 세트',
                    desc: '8", 10", 12", 13", 14", 16" 탐 (6개) + 22" 킥 + 14" 스네어',
                  },
                  {
                    tomCount: 5,
                    label: '6기통 (5탐 + 킥)',
                    badge: '5탐 표준',
                    desc: '8", 10", 12", 14", 16" 탐 (5개) + 22" 킥 + 14" 스네어',
                  },
                  {
                    tomCount: 4,
                    label: '5기통 (4탐 + 킥)',
                    badge: '4탐 락/팝',
                    desc: '10", 12", 14", 16" 탐 (4개) + 22" 킥 + 14" 스네어',
                  },
                  {
                    tomCount: 3,
                    label: '4기통 (3탐 + 킥)',
                    badge: '3탐 스탠다드',
                    desc: '10", 12", 14" 탐 (3개) + 22" 킥 + 14" 스네어',
                  },
                  {
                    tomCount: 2,
                    label: '3기통 (2탐 + 킥)',
                    badge: '2탐 재즈',
                    desc: '12", 16" 탐 (2개) + 22" 킥 + 14" 스네어',
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
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
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

          {/* TAB 3: 킥 드럼 (Bass Drum) Tuning Guide (Page 6) */}
          {activeTab === 'kick' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Disc size={16} className="text-rose-400" />
                  <h4 className="font-bold text-rose-300 text-sm">킥 드럼 튜닝법</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  킥 드럼은 <strong>전면 헤드 러그 피치를 타격면보다 완전 5도 (1.5배) 높게</strong> 튜닝하는 것이 좋습니다. 이렇게 하면 묵직한 펀치감과 선명한 어택이 형성됩니다.
                </p>
              </div>

              {/* Bass Drum Recommendations Table */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300 px-1">
                  직경별 추천 튜닝표
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {BASS_DRUM_RECOMMENDATIONS.map((rec) => (
                    <div
                      key={`${rec.size}-${rec.fundamentalNote}`}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/60 transition flex items-center justify-between"
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
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
                        >
                          적용
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Damping & Kick-Port Tips */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-400 leading-relaxed">
                <div className="font-bold text-cyan-300">킥 드럼 세팅 꿀팁</div>
                <div>• <strong>홀</strong>: 전면 헤드에 마이크 홀이 있으면 공기 저항이 줄어 서스테인이 짧아지므로 타격면을 정확히 맞춥니다.</div>
                <div>• <strong>뮤트/댐핑</strong>: 킥 내부 베개나 뮤트 패드가 헤드에 살짝 닿도록 조절하여 원치 않는 공명 잔향을 억제합니다.</div>
              </div>
            </div>
          )}

          {/* TAB 4: Global Resonance Setting */}
          {activeTab === 'resonance' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                헤드 간 피치 비율(서스테인/공명 길이)을 글로벌 설정합니다. 윗면과 아랫면의 러그 피치 차이에 따라 사운드 감쇄 속도가 결정됩니다.
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'max' as ResonanceType,
                    title: '최대 공명',
                    desc: '상/하 러그 피치를 완전히 동일(기본음의 1.75배)하게 튜닝하여 가장 긴 서스테인과 울림 제공',
                    ratio: '상단 1.75x / 하단 1.75x',
                  },
                  {
                    key: 'high' as ResonanceType,
                    title: '높은 공명',
                    desc: '라이브 공연 등 풍부한 울림이 필요할 때 추천',
                    ratio: '상단 1.5x / 하단 1.85x',
                  },
                  {
                    key: 'medium' as ResonanceType,
                    title: '중간 공명 (추천)',
                    desc: '가장 자연스럽고 균형 잡힌 톤으로 범용적인 표준 세팅',
                    ratio: '상단 1.4x / 하단 2.0x',
                  },
                  {
                    key: 'low' as ResonanceType,
                    title: '낮은 공명',
                    desc: '빠른 감쇄와 타이트한 사운드. 마이크 녹음 및 스튜디오 작업에 적합',
                    ratio: '상단 1.2x / 하단 2.3x',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setSelectedRes(item.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${selectedRes === item.key
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
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
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                    >
                      <div className="text-xs">{bias.label}</div>
                      <div className="text-[10px] text-slate-400">{bias.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to all drums checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={applyToAllDrums}
                  onChange={(e) => setApplyToAllDrums(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 accent-cyan-400 w-4 h-4 cursor-pointer"
                />
                현재 드럼 세트 내 모든 탐/스네어에 설정 일괄 적용
              </label>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveResonance}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  글로벌 공명 설정 적용
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Tuning Guide Summary */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              {/* Snare Guide Section */}
              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/50 space-y-1.5">
                <h4 className="font-bold text-amber-300 text-sm">스네어 드럼 가이드</h4>
                <p className="text-slate-400">
                  스네어는 14인치가 전 세계 표준이며 기본음 <strong>3F# (185Hz)</strong>, 타격면 <strong>3B (252Hz)</strong>, 스네어사이드 <strong>4F# (378Hz)</strong>가 가장 이상적인 추천값입니다.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SNARE_DRUM_RECOMMENDATIONS.slice(0, 4).map((s) => (
                    <span key={s.fundamentalNote} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px]">
                      {s.fundamentalNote} ({s.fundamentalHz}Hz)
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-300 text-sm">드럼 튜닝 5단계 요약</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>원하는 음정 간격(완전 4도, 메이저 코드 등)을 선택하여 기본음 결정</li>
                  <li>공명 정도를 결정(최대, 높음, 중간, 낮음)</li>
                  <li>공식에 따라 윗면과 아랫면의 러그 피치를 계산</li>
                  <li>각 러그의 음정을 측정하며 동일한 음정으로 균등화</li>
                  <li>가운데 타격 시 목표 기본음 확인</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-cyan-300 text-sm">꿀팁: 드럼 헤드 뮤트</h4>
                <p className="text-slate-400">
                  러그 피치를 측정할 때는 드럼 한가운데에 손가락을 살짝 대거나 뮤트 젤을 올려 기본음 잔향을 줄이면 러그 피치 감지 정확도가 훨씬 높아집니다!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preset Confirmation Dialog Overlay */}
        {presetToConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/40">
                <Music size={22} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  프리셋 적용 확인
                </h4>
                <div className="text-sm font-semibold text-cyan-300">
                  [{presetToConfirm.koreanName}]
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  선택하신 프리셋으로 드럼 세트 구성 및 각 탐의 목표 음정이 변경됩니다. 계속 진행하시겠습니까?
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
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/25"
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

