import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Activity,
  Mic,
  MicOff,
  Filter,
  Smartphone,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { DrumItem, TuningTargetHead, TuningMode, ResonanceType, HeadBias, DetectedPitchInfo } from './types';
import {
  DEFAULT_DRUM_KIT,
  TUNING_PRESETS,
  calculateLugFrequencies,
  BASE_NOTE_FREQUENCIES,
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
  const [selectedDrumId, setSelectedDrumId] = useState<string>('tom-12'); // 12" tom selected by default (matches front.png)
  const [targetHead, setTargetHead] = useState<TuningTargetHead>('top'); // 윗면 selected by default (matches front.png)
  const [tuningMode, setTuningMode] = useState<TuningMode>('lug'); // 러그 tuning by default

  // Global Tuning Settings
  const [globalResonance, setGlobalResonance] = useState<ResonanceType>('medium');
  const [globalHeadBias, setGlobalHeadBias] = useState<HeadBias>('bottom-higher');
  const [kitSize, setKitSize] = useState<number>(6);

  // Audio Engine State
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
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

  // Initialize Audio Callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (info) => setDetectedPitch(info),
      null // SpectrogramView handles canvas rendering
    );

    return () => {
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
      if (started) {
        setIsMicActive(true);
      } else {
        alert('마이크를 시작할 수 없습니다. 마이크 권한을 확인해 주세요.');
      }
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

  // Save individual drum update
  const handleSaveDrum = (updated: DrumItem) => {
    setDrums((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
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
      // 12, 14, Snare
      setDrums(
        DEFAULT_DRUM_KIT.filter(
          (d) => d.id === 'tom-12' || d.id === 'tom-14' || d.id === 'snare-14'
        )
      );
    } else if (count === 4) {
      // 10, 12, 14, Snare
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
      // 10, 12, 14, 16, Snare
      setDrums(DEFAULT_DRUM_KIT.filter((d) => d.id !== 'tom-8'));
    } else {
      // 6 toms + Snare full kit
      setDrums(DEFAULT_DRUM_KIT);
    }
  };

  // Test sound simulation
  const handleSimulateStrike = (hz?: number) => {
    const target = hz || activeTargetHz;
    audioEngine.simulateDrumHit(target);
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top App Bar */}
      <header className="w-full px-4 py-2.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              TuneBot <span className="text-[10px] text-cyan-400 font-mono font-medium px-1.5 py-0.2 bg-cyan-950 border border-cyan-800 rounded">DRUM TUNER</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Test Sound button */}
          <button
            onClick={() => handleSimulateStrike()}
            title="타격음 시뮬레이션 (테스트)"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition"
          >
            <Volume2 size={16} />
          </button>

          {/* Android Guide Button */}
          <button
            onClick={() => setIsAndroidGuideOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold hover:bg-cyan-900 transition"
          >
            <Smartphone size={14} />
            <span>폰 연결/설치</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-between px-3 py-1">
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
        />

        {/* 3. Drum Kit Diagram (matches 배치.png and front.png) */}
        <DrumKitView
          drums={drums}
          selectedDrumId={selectedDrumId}
          onSelectDrum={handleSelectDrum}
          onOpenDrumSettings={handleOpenDrumSettings}
          onSimulateTap={(drum) => handleSimulateStrike(drum.targetFundamentalHz)}
        />
      </main>

      {/* Bottom Action / Navigation Bar (matches app.md) */}
      <nav className="w-full bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-around z-30 sticky bottom-0">
        {/* Settings Button: 톱니바퀴 (Tuning guide chords & global resonance) */}
        <button
          onClick={() => setIsGlobalSettingsOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
        >
          <Settings size={22} />
          <span className="text-[10px] font-medium">가이드 설정</span>
        </button>

        {/* Center: Microphone Toggle & Filter Mode */}
        <div className="flex items-center gap-2">
          {/* Filter Mode Toggle (Tune-Bot FILTER) */}
          <button
            onClick={() => setIsFilterActive(!isFilterActive)}
            title="필터 모드: 목표 주파수 대역 외 잡음 차단"
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-0.5 transition ${
              isFilterActive
                ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Filter size={18} />
            <span className="text-[9px] font-bold">필터 {isFilterActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mic Master Button */}
          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs tracking-wider transition-all duration-300 shadow-xl ${
              isMicActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/40 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:brightness-110 shadow-cyan-500/30'
            }`}
          >
            {isMicActive ? (
              <>
                <Mic size={18} className="animate-bounce" />
                <span>수음 중</span>
              </>
            ) : (
              <>
                <MicOff size={18} />
                <span>마이크 시작</span>
              </>
            )}
          </button>
        </div>

        {/* Spectrometer Button: 그래프 모양 버튼 (matches app.md) */}
        <button
          onClick={() => setViewMode('spectrogram')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
        >
          <Activity size={22} className="text-cyan-400" />
          <span className="text-[10px] font-medium">스펙트로</span>
        </button>
      </nav>

      {/* Fullscreen Spectrogram View (specto.png) */}
      {viewMode === 'spectrogram' && (
        <SpectrogramView
          onBack={() => setViewMode('tuner')}
          detectedPitch={detectedPitch}
          onSimulateHit={handleSimulateStrike}
        />
      )}

      {/* Drum Settings Modal (Double-click on tom) */}
      <DrumSettingsModal
        drum={currentDrum}
        isOpen={isDrumSettingsOpen}
        onClose={() => setIsDrumSettingsOpen(false)}
        onSave={handleSaveDrum}
        onSimulateSound={handleSimulateStrike}
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
