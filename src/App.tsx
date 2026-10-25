import React, { useState, useEffect } from 'react';
import {
  Settings,
  Activity,
  Mic,
  MicOff,
  Filter,
  Smartphone,
} from 'lucide-react';
import { DrumItem, TuningTargetHead, TuningMode, ResonanceType, HeadBias, DetectedPitchInfo } from './types';
import {
  DEFAULT_DRUM_KIT,
  TUNING_PRESETS,
  calculateLugFrequencies,
  getKitByTomCount,
} from './constants/tuningGuide';
import { audioEngine } from './services/audioEngine';
import { TuningMeter } from './components/TuningMeter';
import { HeadTargetCards } from './components/HeadTargetCards';
import { DrumKitView } from './components/DrumKitView';
import { DrumSettingsModal } from './components/DrumSettingsModal';
import { GlobalSettingsModal } from './components/GlobalSettingsModal';
import { SpectrogramView } from './components/SpectrogramView';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { frequencyToNote } from './utils/audioMath';

export const App: React.FC = () => {
  // Drum Kit State
  const [drums, setDrums] = useState<DrumItem[]>(DEFAULT_DRUM_KIT);
  const [selectedDrumId, setSelectedDrumId] = useState<string>('tom-12'); // 12" tom selected by default
  const [targetHead, setTargetHead] = useState<TuningTargetHead>('top'); // 윗면 selected by default
  const [tuningMode, setTuningMode] = useState<TuningMode>('fundamental'); // 윗면 중앙이 기본으로 시작

  // Global Tuning Settings
  const [globalResonance, setGlobalResonance] = useState<ResonanceType>('high');
  const [globalHeadBias, setGlobalHeadBias] = useState<HeadBias>('bottom-higher');
  const [kitSize, setKitSize] = useState<number>(5);

  // Audio Engine State: Microphone is ON by default
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [smoothingDurationSec, setSmoothingDurationSec] = useState<number>(1.0); // default: 1.0초 (1초에 한 번 갱신)
  const [detectedPitch, setDetectedPitch] = useState<DetectedPitchInfo | null>(null);

  // View & Modals
  const [viewMode, setViewMode] = useState<'tuner' | 'spectrogram'>('tuner');
  const [isDrumSettingsOpen, setIsDrumSettingsOpen] = useState<boolean>(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);

  // Current selected drum
  const currentDrum = drums.find((d) => d.id === selectedDrumId) || drums[0];

  // Active Target Frequency (윗면 러그 또는 아랫면 러그)
  const activeTargetHz =
    targetHead === 'top'
      ? currentDrum.targetTopLugHz
      : currentDrum.targetBottomLugHz;

  // Active Target Note dynamically aligned with the exact active target frequency
  const activeTargetNote = frequencyToNote(activeTargetHz).fullName;

  // Initialize and Auto-Start Microphone (Default ON)
  useEffect(() => {
    audioEngine.setCallbacks(
      (info) => setDetectedPitch(info),
      null
    );

    const startMic = async () => {
      const started = await audioEngine.start();
      setIsMicActive(started);
    };

    startMic();

    // In mobile browsers/Webview, ensure AudioContext resumes on first user touch if blocked by autoplay policy
    const handleFirstTouch = () => {
      if (!audioEngine.isActive()) {
        audioEngine.start().then((started) => setIsMicActive(started));
      }
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('click', handleFirstTouch);
    window.addEventListener('touchstart', handleFirstTouch);

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      audioEngine.stop();
    };
  }, []);

  // Update Audio Filter when target frequency or filter toggle changes
  useEffect(() => {
    audioEngine.setFilter(isFilterActive, activeTargetHz);
  }, [isFilterActive, activeTargetHz]);

  // Update Sliding Window smoothing duration in AudioEngine
  useEffect(() => {
    audioEngine.setSmoothingDurationSec(smoothingDurationSec);
  }, [smoothingDurationSec]);

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (isMicActive) {
      audioEngine.stop();
      setIsMicActive(false);
    } else {
      const started = await audioEngine.start();
      setIsMicActive(started);
    }
  };

  // Drum selection (1st click)
  const handleSelectDrum = (drum: DrumItem) => {
    setSelectedDrumId(drum.id);
  };

  // Open drum settings modal (2nd click on selected drum)
  const handleOpenDrumSettings = (drum: DrumItem) => {
    setSelectedDrumId(drum.id);
    setIsDrumSettingsOpen(true);
  };

  // Save individual drum update (Reset tuning completion for this drum when settings change)
  const handleSaveDrum = (updated: DrumItem) => {
    setDrums((prev) =>
      prev.map((d) =>
        d.id === updated.id
          ? {
            ...updated,
            completedTuning: {
              topFundamental: false,
              topLug: false,
              bottomFundamental: false,
              bottomLug: false,
            },
          }
          : d
      )
    );
  };

  // Toggle tuning completion for a specific target on current drum
  const handleToggleCompleted = (head: TuningTargetHead) => {
    setDrums((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDrumId) return d;
        const current = d.completedTuning || {};
        const key = head === 'top' ? 'topLug' : 'bottomLug';
        return {
          ...d,
          completedTuning: {
            ...current,
            [key]: !current[key],
          },
        };
      })
    );
  };

  // Apply Global Resonance to all drums
  const handleUpdateGlobalResonance = (
    newRes: ResonanceType,
    newBias: HeadBias,
    applyToAll: boolean
  ) => {
    setGlobalResonance(newRes);
    setGlobalHeadBias(newBias);

    if (applyToAll) {
      setDrums((prev) =>
        prev.map((d) => {
          const { topLugHz, bottomLugHz } = calculateLugFrequencies(
            d.targetFundamentalHz,
            newRes,
            newBias
          );
          return {
            ...d,
            resonance: newRes,
            headBias: newBias,
            targetTopLugHz: topLugHz,
            targetBottomLugHz: bottomLugHz,
          };
        })
      );
    }
  };

  // Apply Tuning Guide Preset (Table 1)
  // When user selects e.g. 6 toms, automatically switch kit to 6 toms with high resonance!
  const handleApplyPreset = (presetId: string) => {
    const preset = TUNING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Use preset resonance (defaults to 'high')
    const presetResonance: ResonanceType = preset.resonance || 'high';
    setGlobalResonance(presetResonance);

    // 1. Rebuild kit for this preset's exact tom count (2~6 toms) with high resonance
    const baseKit = getKitByTomCount(preset.numToms, presetResonance, globalHeadBias);

    // 2. Map the preset's fundamental frequencies to the toms in the new kit
    const updatedKit = baseKit.map((drum) => {
      if (drum.type === 'rack-tom' || drum.type === 'floor-tom') {
        const match = preset.toms.find((t) => t.size === drum.sizeInches);
        if (match) {
          const { topLugHz, bottomLugHz } = calculateLugFrequencies(
            match.fundamentalHz,
            presetResonance,
            drum.headBias || globalHeadBias
          );
          return {
            ...drum,
            resonance: presetResonance,
            targetFundamentalHz: match.fundamentalHz,
            targetFundamentalNote: match.fundamentalNote,
            targetTopLugHz: topLugHz,
            targetBottomLugHz: bottomLugHz,
            completedTuning: {
              topFundamental: false,
              topLug: false,
              bottomFundamental: false,
              bottomLug: false,
            },
          };
        }
      }
      return {
        ...drum,
        resonance: presetResonance,
        completedTuning: {
          topFundamental: false,
          topLug: false,
          bottomFundamental: false,
          bottomLug: false,
        },
      };
    });

    setDrums(updatedKit);
    setKitSize(preset.numToms);

    // Ensure selected drum exists in new kit
    if (!updatedKit.some((d) => d.id === selectedDrumId)) {
      const fallback = updatedKit.find((d) => d.id === 'tom-12') || updatedKit[0];
      setSelectedDrumId(fallback.id);
    }
  };

  // Change Drum Kit Size (n기통)
  const handleSetKitSize = (tomCount: number) => {
    setKitSize(tomCount);
    const newKit = getKitByTomCount(tomCount, globalResonance, globalHeadBias);
    setDrums(newKit);
    if (!newKit.some((d) => d.id === selectedDrumId)) {
      const fallback = newKit.find((d) => d.id === 'tom-12') || newKit[0];
      setSelectedDrumId(fallback.id);
    }
  };

  // Apply Kick Drum recommendation (Guide Page 6)
  const handleApplyKickRecommendation = (rec: {
    size: number;
    fundamentalNote: string;
    fundamentalHz: number;
    batterLugHz: number;
    resonantLugHz: number;
  }) => {
    setDrums((prev) =>
      prev.map((d) => {
        if (d.type === 'bass') {
          return {
            ...d,
            name: `${rec.size}" 킥 드럼`,
            sizeInches: rec.size,
            targetFundamentalHz: rec.fundamentalHz,
            targetFundamentalNote: rec.fundamentalNote,
            targetTopLugHz: rec.batterLugHz,
            targetBottomLugHz: rec.resonantLugHz,
            completedTuning: {
              topFundamental: false,
              topLug: false,
              bottomFundamental: false,
              bottomLug: false,
            },
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden bg-[#070b12] text-slate-100 flex flex-col font-sans select-none relative">
      {/* Sleek Minimalist Top Navigation Bar */}
      <header className="w-full max-w-lg mx-auto px-4 pt-2 pb-0.5 flex items-center justify-between flex-shrink-0 z-30">
        {/* Brand & Active Drum Quick Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          </div>

          <button
            onClick={() => setIsGlobalSettingsOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition flex items-center gap-1 shadow-sm"
            title="키트 설정 및 튜닝 가이드 열기"
          >
            <span>{drums.length}기통</span>
          </button>
        </div>

        {/* Clean Header Action Controls (Replaces messy bottom-left floating tower) */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 shadow-md backdrop-blur-md">
          {/* Filter Toggle */}
          <button
            onClick={() => setIsFilterActive(!isFilterActive)}
            className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${isFilterActive
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
            title="대역 필터 (목표 주파수 외 잡음 차단)"
          >
            <Filter size={13} className={isFilterActive ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="text-[11px]">필터</span>
          </button>

          {/* Spectrogram View Button */}
          <button
            onClick={() => setViewMode('spectrogram')}
            className="px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition"
            title="스펙트로미터 화면"
          >
            <Activity size={13} className="text-cyan-400" />
            <span className="text-[11px]">스펙트로</span>
          </button>

          {/* Microphone Toggle Button */}
          <button
            onClick={handleToggleMic}
            className={`p-1.5 rounded-xl transition ${isMicActive
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-800/80 text-slate-500'
              }`}
            title={isMicActive ? '마이크 켜짐 (터치 시 일시정지)' : '마이크 꺼짐 (터치 시 켜기)'}
          >
            {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsGlobalSettingsOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition"
            title="튜닝 가이드 및 설정"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area (Strictly height-fit, no scroll) */}
      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto flex flex-col items-center justify-between px-3 pb-2 overflow-hidden">
        {/* 1. Top Tuning Meter Bar & Readout (matches front.png) */}
        <TuningMeter
          detectedPitch={detectedPitch}
          targetHz={activeTargetHz}
          targetNote={activeTargetNote}
          isFilterActive={isFilterActive}
        />

        {/* 2. Top Lug vs Bottom Lug Target Cards */}
        <HeadTargetCards
          drum={currentDrum}
          targetHead={targetHead}
          onSelectHead={setTargetHead}
          onToggleCompleted={handleToggleCompleted}
          detectedPitch={detectedPitch}
        />

        {/* 3. Drum Kit Diagram (matches 배치.png and front.png) */}
        <DrumKitView
          drums={drums}
          selectedDrumId={selectedDrumId}
          onSelectDrum={handleSelectDrum}
          onOpenDrumSettings={handleOpenDrumSettings}
        />
      </main>

      {/* Fullscreen Spectrogram View (specto.png) */}
      {viewMode === 'spectrogram' && (
        <SpectrogramView
          onBack={() => setViewMode('tuner')}
          detectedPitch={detectedPitch}
          drum={currentDrum}
          drums={drums}
          onSelectDrum={handleSelectDrum}
        />
      )}

      {/* Drum Settings Modal (Double-click on tom) */}
      <DrumSettingsModal
        key={`${currentDrum.id}-${isDrumSettingsOpen}`}
        drum={currentDrum}
        isOpen={isDrumSettingsOpen}
        onClose={() => setIsDrumSettingsOpen(false)}
        onSave={handleSaveDrum}
      />

      {/* Global Settings Modal (Tuning guide chord selection & global resonance) */}
      <GlobalSettingsModal
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
        globalResonance={globalResonance}
        globalHeadBias={globalHeadBias}
        onUpdateGlobalResonance={handleUpdateGlobalResonance}
        onApplyPreset={handleApplyPreset}
        onSetKitSize={handleSetKitSize}
        onApplyKickRecommendation={handleApplyKickRecommendation}
        currentNumToms={kitSize}
        smoothingDurationSec={smoothingDurationSec}
        onUpdateSmoothingDurationSec={setSmoothingDurationSec}
      />

      {/* Android Connect & Installation Guide Modal */}
      <AndroidGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
      />
    </div>
  );
};

export default App;
