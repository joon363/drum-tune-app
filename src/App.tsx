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
} from './constants/tuningGuide';
import { audioEngine } from './services/audioEngine';
import { TuningMeter } from './components/TuningMeter';
import { HeadTargetCards } from './components/HeadTargetCards';
import { DrumKitView } from './components/DrumKitView';
import { DrumSettingsModal } from './components/DrumSettingsModal';
import { GlobalSettingsModal } from './components/GlobalSettingsModal';
import { SpectrogramView } from './components/SpectrogramView';
import { AndroidGuideModal } from './components/AndroidGuideModal';

export const App: React.FC = () => {
  // Drum Kit State
  const [drums, setDrums] = useState<DrumItem[]>(DEFAULT_DRUM_KIT);
  const [selectedDrumId, setSelectedDrumId] = useState<string>('tom-12'); // 12" tom selected by default
  const [targetHead, setTargetHead] = useState<TuningTargetHead>('top'); // 윗면 selected by default
  const [tuningMode, setTuningMode] = useState<TuningMode>('fundamental'); // 윗면 중앙이 기본으로 시작

  // Global Tuning Settings
  const [globalResonance, setGlobalResonance] = useState<ResonanceType>('medium');
  const [globalHeadBias, setGlobalHeadBias] = useState<HeadBias>('bottom-higher');
  const [kitSize, setKitSize] = useState<number>(6);

  // Audio Engine State: Microphone is ON by default
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(true);
  const [detectedPitch, setDetectedPitch] = useState<DetectedPitchInfo | null>(null);

  // View & Modals
  const [viewMode, setViewMode] = useState<'tuner' | 'spectrogram'>('tuner');
  const [isDrumSettingsOpen, setIsDrumSettingsOpen] = useState<boolean>(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);

  // Current selected drum
  const currentDrum = drums.find((d) => d.id === selectedDrumId) || drums[0];

  // Active Target Frequency
  const activeTargetHz =
    tuningMode === 'fundamental'
      ? currentDrum.targetFundamentalHz
      : targetHead === 'top'
        ? currentDrum.targetTopLugHz
        : currentDrum.targetBottomLugHz;

  const activeTargetNote = currentDrum.targetFundamentalNote;

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
  const handleToggleCompleted = (head: TuningTargetHead, mode: TuningMode) => {
    setDrums((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDrumId) return d;
        const current = d.completedTuning || {};
        const key =
          head === 'top'
            ? mode === 'fundamental'
              ? 'topFundamental'
              : 'topLug'
            : mode === 'fundamental'
            ? 'bottomFundamental'
            : 'bottomLug';
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
  const handleApplyPreset = (presetId: string) => {
    const preset = TUNING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setDrums((prev) => {
      return prev.map((drum) => {
        const match = preset.toms.find((t) => t.size === drum.sizeInches);
        if (match) {
          const { topLugHz, bottomLugHz } = calculateLugFrequencies(
            match.fundamentalHz,
            drum.resonance || globalResonance,
            drum.headBias || globalHeadBias
          );
          return {
            ...drum,
            targetFundamentalHz: match.fundamentalHz,
            targetFundamentalNote: match.fundamentalNote,
            targetTopLugHz: topLugHz,
            targetBottomLugHz: bottomLugHz,
          };
        }
        return drum;
      });
    });
  };

  // Change Drum Kit Size (n기통)
  const handleSetKitSize = (count: number) => {
    setKitSize(count);
    if (count === 3) {
      setDrums(
        DEFAULT_DRUM_KIT.filter(
          (d) => d.id === 'tom-12' || d.id === 'tom-14' || d.id === 'snare-14'
        )
      );
    } else if (count === 4) {
      setDrums(
        DEFAULT_DRUM_KIT.filter(
          (d) =>
            d.id === 'tom-10' ||
            d.id === 'tom-12' ||
            d.id === 'tom-14' ||
            d.id === 'snare-14'
        )
      );
    } else if (count === 5) {
      setDrums(DEFAULT_DRUM_KIT.filter((d) => d.id !== 'tom-8'));
    } else {
      setDrums(DEFAULT_DRUM_KIT);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">

      {/* Main Content Area (Full height available, no footer) */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-between px-3 py-1 pb-16">
        {/* 1. Top Tuning Meter Bar & Readout (matches front.png) */}
        <TuningMeter
          detectedPitch={detectedPitch}
          targetHz={activeTargetHz}
          targetNote={activeTargetNote}
          isFilterActive={isFilterActive}
        />

        {/* 2. Batter vs Resonant Head Target Cards (matches front.png) */}
        <HeadTargetCards
          drum={currentDrum}
          targetHead={targetHead}
          tuningMode={tuningMode}
          onSelectHead={setTargetHead}
          onSelectMode={setTuningMode}
          onToggleCompleted={handleToggleCompleted}
        />

        {/* 3. Drum Kit Diagram (matches 배치.png and front.png) */}
        <DrumKitView
          drums={drums}
          selectedDrumId={selectedDrumId}
          onSelectDrum={handleSelectDrum}
          onOpenDrumSettings={handleOpenDrumSettings}
        />
      </main>

      {/* Floating Action Buttons Cluster on Bottom-Left (Vertical Stack) */}
      <div className="fixed bottom-5 left-4 z-40 flex flex-col items-center gap-2">
        {/* Spectrometer FAB (그래프 모양 스펙트로 버튼) */}
        <button
          onClick={() => setViewMode('spectrogram')}
          className="w-11 h-11 rounded-xl bg-slate-900 text-cyan-300 border border-cyan-400 flex flex-col items-center justify-center transition active:scale-95 shadow-lg"
          title="스펙트로미터 화면으로 전환"
        >
          <Activity size={18} className="text-cyan-300" />
          <span className="text-[9px] text-cyan-300 font-bold">스펙트로</span>
        </button>

        {/* Filter Toggle FAB */}
        <button
          onClick={() => setIsFilterActive(!isFilterActive)}
          className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 shadow-lg ${
            isFilterActive
              ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
          title="필터 모드 (목표 대역 외 잡음 차단)"
        >
          <Filter size={16} />
          <span className="text-[9px] font-bold">{isFilterActive ? '필터ON' : '필터OFF'}</span>
        </button>

        {/* Settings FAB (톱니바퀴) */}
        <button
          onClick={() => setIsGlobalSettingsOpen(true)}
          className="w-11 h-11 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 flex flex-col items-center justify-center transition active:scale-95 shadow-lg"
          title="튜닝 가이드 및 글로벌 설정"
        >
          <Settings size={18} className="text-cyan-400" />
          <span className="text-[9px] text-slate-400 font-semibold">설정</span>
        </button>

        {/* Mic Master Toggle FAB (Default ON) */}
        <button
          onClick={handleToggleMic}
          className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 shadow-lg ${
            isMicActive
              ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
          title={isMicActive ? '마이크 켜짐 (터치 시 일시정지)' : '마이크 꺼짐 (터치 시 켜기)'}
        >
          {isMicActive ? (
            <>
              <Mic size={17} className="text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-bold">마이크ON</span>
            </>
          ) : (
            <>
              <MicOff size={17} />
              <span className="text-[9px] text-slate-400 font-bold">OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Fullscreen Spectrogram View (specto.png) */}
      {viewMode === 'spectrogram' && (
        <SpectrogramView
          onBack={() => setViewMode('tuner')}
          detectedPitch={detectedPitch}
        />
      )}

      {/* Drum Settings Modal (Double-click on tom) */}
      <DrumSettingsModal
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
        currentNumToms={kitSize}
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
