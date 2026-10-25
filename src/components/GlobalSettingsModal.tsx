import React, { useState } from 'react';
import { X, Check, BookOpen, Music, Layers, Sliders, RotateCcw } from 'lucide-react';
import { ResonanceType, HeadBias, DrumItem } from '../types';
import {
  INTERVAL_TYPES,
  TUNING_PRESETS,
  calculateLugFrequencies,
  DEFAULT_DRUM_KIT,
} from '../constants/tuningGuide';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalResonance: ResonanceType;
  globalHeadBias: HeadBias;
  onUpdateGlobalResonance: (res: ResonanceType, bias: HeadBias, applyToAll: boolean) => void;
  onApplyPreset: (presetId: string) => void;
  onSetKitSize: (numToms: number) => void;
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
  currentNumToms,
}) => {
  const [selectedRes, setSelectedRes] = useState<ResonanceType>(globalResonance);
  const [selectedBias, setSelectedBias] = useState<HeadBias>(globalHeadBias);
  const [applyToAllDrums, setApplyToAllDrums] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chord' | 'resonance' | 'kit' | 'guide'>('chord');

  if (!isOpen) return null;

  const handleSaveResonance = () => {
    onUpdateGlobalResonance(selectedRes, selectedBias, applyToAllDrums);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              튜닝가이드 화음 & 글로벌 설정
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
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('chord')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'chord'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Music size={14} />
            화음(Interval) 프리셋
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resonance')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'resonance'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Sliders size={14} />
            글로벌 Resonance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kit')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'kit'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Layers size={14} />
            n기통 설정
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <BookOpen size={14} />
            가이드 요약
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* TAB 1: Chord & Interval Presets */}
          {activeTab === 'chord' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Tune-Bot 공식 가이드 Table 1에 입각한 추천 음정 및 화음 프리셋입니다. 원하는 프리셋을 선택하면 모든 탐의 목표음이 조화롭게 자동 계산됩니다.
              </div>

              <div className="space-y-2">
                {TUNING_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 transition group cursor-pointer"
                    onClick={() => {
                      onApplyPreset(preset.id);
                      onClose();
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

                    {/* Tom Notes preview */}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Global Resonance Setting */}
          {activeTab === 'resonance' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                헤드 간 피치 비율(서스테인/공명 길이)을 글로벌 설정합니다. 윗면과 아랫면의 러그 피치 차이에 따라 사운드 감쇄 속도가 결정됩니다.
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'max' as ResonanceType,
                    title: '최대 공명 (Maximum Resonance)',
                    desc: '상/하 러그 피치를 완전히 동일(기본음의 1.75배)하게 튜닝하여 가장 긴 서스테인과 울림 제공',
                    ratio: 'Top 1.75x / Bottom 1.75x',
                  },
                  {
                    key: 'high' as ResonanceType,
                    title: '높은 공명 (High Resonance)',
                    desc: '라이브 공연 등 풍부한 울림이 필요할 때 추천 (1.5x / 1.85x)',
                    ratio: 'Top 1.5x / Bottom 1.85x',
                  },
                  {
                    key: 'medium' as ResonanceType,
                    title: '중간 공명 (Medium Resonance - 추천)',
                    desc: '가장 자연스럽고 균형 잡힌 톤으로 범용적인 표준 세팅 (1.4x / 2.0x)',
                    ratio: 'Top 1.4x / Bottom 2.0x',
                  },
                  {
                    key: 'low' as ResonanceType,
                    title: '낮은 공명 (Low Resonance)',
                    desc: '빠른 감쇄와 타이트한 사운드. 마이크 녹음 및 스튜디오 작업에 적합 (1.2x / 2.3x)',
                    ratio: 'Top 1.2x / Bottom 2.3x',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setSelectedRes(item.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedRes === item.key
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
                  기본 헤드 피치 바이어스 (Head Pitch Bias)
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
                      className={`p-2 rounded-xl text-center border transition ${
                        selectedBias === bias.key
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
                현재 드럼 세트 내 모든 탐/스네어에 즉시 공명 공식 일괄 적용
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

          {/* TAB 3: n기통 Kit Configuration */}
          {activeTab === 'kit' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                내 드럼 세트의 탐 개수(n기통)를 설정합니다. 홈 화면의 드럼 배치가 선택한 기통수에 맞추어 최적 배치됩니다.
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { count: 3, label: '3기통 (1 탐 + 플로어 + 스네어)', desc: '12", 14", Snare' },
                  { count: 4, label: '4기통 (2 탐 + 플로어 + 스네어)', desc: '10", 12", 14", Snare' },
                  { count: 5, label: '5기통 (2 탐 + 2 플로어 + 스네어)', desc: '10", 12", 14", 16", Snare' },
                  { count: 6, label: '6기통 (3 탐 + 2 플로어 + 스네어)', desc: '8", 10", 12", 14", 16", Snare (기본)' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => {
                      onSetKitSize(item.count);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      currentNumToms === item.count
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-white mb-0.5">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Tuning Guide Summary */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-300 text-sm">Tune-Bot 튜닝 단계 요약</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>원하는 음정 간격(완전 4도, 메이저 코드 등)을 선택하여 기본음(Fundamental) 결정</li>
                  <li>공명(Resonance) 정도를 결정(최대, 높음, 중간, 낮음)</li>
                  <li>공식에 따라 윗면(Top)과 아랫면(Bottom)의 러그 피치를 계산</li>
                  <li>각 러그의 음정을 측정하며 동일한 음정으로 균등화(Equalize)</li>
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
      </div>
    </div>
  );
};
