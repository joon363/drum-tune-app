import { ResonanceType, HeadBias, TuningGuidePreset, DrumItem } from '../types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const BASE_NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 1
  '1C': 32.7, '1C#': 34.6, '1D': 36.7, '1D#': 38.9, '1E': 41.2, '1F': 43.7, '1F#': 46.2, '1G': 49.0, '1G#': 51.9, '1A': 55.0, '1A#': 58.3, '1B': 61.7,
  // Octave 2
  '2C': 65.4, '2C#': 69.3, '2D': 73.4, '2D#': 77.8, '2E': 82.4, '2F': 87.3, '2F#': 92.5, '2G': 98.0, '2G#': 103.8, '2A': 110.0, '2A#': 116.5, '2B': 123.5,
  // Octave 3
  '3C': 130.8, '3C#': 138.6, '3D': 146.8, '3D#': 155.6, '3E': 164.8, '3F': 174.6, '3F#': 185.0, '3G': 196.0, '3G#': 207.7, '3A': 220.0, '3A#': 233.1, '3B': 246.9,
  // Octave 4
  '4C': 261.6, '4C#': 277.2, '4D': 293.7, '4D#': 311.1, '4E': 329.6, '4F': 349.2, '4F#': 370.0, '4G': 392.0, '4G#': 415.3, '4A': 440.0, '4A#': 466.1, '4B': 493.9,
};

// Lug Multipliers based on Tuning Guide Pages 3-4
export const RESONANCE_MULTIPLIERS: Record<ResonanceType, { top: number; bottom: number }> = {
  max: { top: 1.75, bottom: 1.75 },
  high: { top: 1.5, bottom: 1.85 },
  medium: { top: 1.4, bottom: 2.0 },
  low: { top: 1.2, bottom: 2.3 },
};

export function calculateLugFrequencies(
  fundHz: number,
  resonance: ResonanceType,
  headBias: HeadBias
): { topLugHz: number; bottomLugHz: number } {
  const mult = RESONANCE_MULTIPLIERS[resonance];
  if (resonance === 'max' || headBias === 'equal') {
    const hz = Math.round(fundHz * 1.75 * 10) / 10;
    return { topLugHz: hz, bottomLugHz: hz };
  }

  if (headBias === 'bottom-higher') {
    return {
      topLugHz: Math.round(fundHz * mult.top * 10) / 10,
      bottomLugHz: Math.round(fundHz * mult.bottom * 10) / 10,
    };
  } else {
    return {
      topLugHz: Math.round(fundHz * mult.bottom * 10) / 10,
      bottomLugHz: Math.round(fundHz * mult.top * 10) / 10,
    };
  }
}

// Bass Drum Recommendations from Tune-Bot Guide Page 6
// Resonant head lug pitch is a perfect fifth (1.5x) higher than batter head lug pitch
export const BASS_DRUM_RECOMMENDATIONS = [
  { size: 24, fundamentalNote: '1C', fundamentalHz: 32.7, batterLugHz: 49.0, resonantLugHz: 74.0 },
  { size: 24, fundamentalNote: '1C#', fundamentalHz: 34.6, batterLugHz: 52.0, resonantLugHz: 78.0 },
  { size: 22, fundamentalNote: '1D', fundamentalHz: 36.7, batterLugHz: 55.0, resonantLugHz: 82.0 },
  { size: 22, fundamentalNote: '1D#', fundamentalHz: 38.9, batterLugHz: 58.0, resonantLugHz: 87.0 },
  { size: 22, fundamentalNote: '1E', fundamentalHz: 41.2, batterLugHz: 61.0, resonantLugHz: 91.0 },
  { size: 20, fundamentalNote: '1F', fundamentalHz: 43.7, batterLugHz: 64.0, resonantLugHz: 96.0 },
  { size: 20, fundamentalNote: '1F#', fundamentalHz: 46.2, batterLugHz: 68.0, resonantLugHz: 101.0 },
  { size: 18, fundamentalNote: '1G', fundamentalHz: 49.0, batterLugHz: 71.0, resonantLugHz: 107.0 },
];

// Snare Drum Recommendations from Tune-Bot Guide Page 5 (Standard 14" Snare)
export const SNARE_DRUM_RECOMMENDATIONS = [
  { size: 14, fundamentalNote: '3E', fundamentalHz: 164.8, topLugHz: 229.0, bottomLugHz: 343.0, interval: '완전 5도', desc: '로우 & 묵직한 톤' },
  { size: 14, fundamentalNote: '3F', fundamentalHz: 174.6, topLugHz: 240.0, bottomLugHz: 359.0, interval: '완전 5도', desc: '따뜻한 록 톤' },
  { size: 14, fundamentalNote: '3F#', fundamentalHz: 185.0, topLugHz: 252.0, bottomLugHz: 378.0, interval: '완전 5도', desc: '14" 표준 추천' },
  { size: 14, fundamentalNote: '3G', fundamentalHz: 196.0, topLugHz: 266.0, bottomLugHz: 398.0, interval: '완전 5도', desc: '선명한 크랙' },
  { size: 14, fundamentalNote: '3G#', fundamentalHz: 207.7, topLugHz: 299.0, bottomLugHz: 398.0, interval: '완전 4도', desc: '하이 팝 톤' },
  { size: 14, fundamentalNote: '3A', fundamentalHz: 220.0, topLugHz: 318.0, bottomLugHz: 400.0, interval: '장 3도', desc: '펑크 / 레게' },
  { size: 14, fundamentalNote: '3A#', fundamentalHz: 233.1, topLugHz: 356.0, bottomLugHz: 400.0, interval: '단 3도', desc: '타이트한 하이 톤' },
];

// Presets from Table 1 of the Guide
// 7기통 = 6탐 + 1킥 (+ 14" 스네어 기본)
// 6기통 = 5탐 + 1킥 (+ 14" 스네어 기본)
// 5기통 = 4탐 + 1킥 (+ 14" 스네어 기본)
// 4기통 = 3탐 + 1킥 (+ 14" 스네어 기본)
// 3기통 = 2탐 + 1킥 (+ 14" 스네어 기본)
export const TUNING_PRESETS: TuningGuidePreset[] = [
  {
    id: 'toms-6-thirds',
    name: '7기통 - 장3도',
    koreanName: '7기통 - 장3도',
    numToms: 6,
    intervalType: 'Major Thirds',
    rootNote: '3G#',
    toms: [
      { size: 8, fundamentalNote: '3G#', fundamentalHz: 207.7 },
      { size: 10, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 12, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 13, fundamentalNote: '2G#', fundamentalHz: 103.8 },
      { size: 14, fundamentalNote: '2E', fundamentalHz: 82.4 },
      { size: 16, fundamentalNote: '2C', fundamentalHz: 65.4 },
    ],
  },
  {
    id: 'toms-5-thirds',
    name: '6기통 - 장3도',
    koreanName: '6기통 - 장3도',
    numToms: 5,
    intervalType: 'Major Thirds',
    rootNote: '3G#',
    toms: [
      { size: 8, fundamentalNote: '3G#', fundamentalHz: 207.7 },
      { size: 10, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 12, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 14, fundamentalNote: '2G#', fundamentalHz: 103.8 },
      { size: 16, fundamentalNote: '2E', fundamentalHz: 82.4 },
    ],
  },
  {
    id: 'toms-4-post',
    name: '5기통 - Call to Post',
    koreanName: '5기통 - Call to Post',
    numToms: 4,
    intervalType: 'Call to Post',
    rootNote: '3D',
    toms: [
      { size: 10, fundamentalNote: '3D', fundamentalHz: 146.8 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 123.5 },
      { size: 14, fundamentalNote: '2G', fundamentalHz: 98.0 },
      { size: 16, fundamentalNote: '2D', fundamentalHz: 73.4 },
    ],
  },
  {
    id: 'toms-4-fourths',
    name: '5기통 - 완전4도',
    koreanName: '5기통 - 완전4도',
    numToms: 4,
    intervalType: 'Perfect Fourths',
    rootNote: '3E',
    toms: [
      { size: 10, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 123.5 },
      { size: 14, fundamentalNote: '2F#', fundamentalHz: 92.5 },
      { size: 16, fundamentalNote: '2C#', fundamentalHz: 69.3 },
    ],
  },
  {
    id: 'toms-3-chord',
    name: '4기통 - 장조',
    koreanName: '4기통 - 장조',
    numToms: 3,
    intervalType: 'Major Chord',
    rootNote: '3C',
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 12, fundamentalNote: '2A', fundamentalHz: 110.0 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
    ],
  }
];

// Standard 14" Snare drum (스네어는 14" 고정 기본)
export const STANDARD_SNARE: DrumItem = {
  id: 'snare-14',
  name: '14" 스네어',
  label: 'S',
  type: 'snare',
  sizeInches: 14,
  targetFundamentalHz: 185.0, // 3F#
  targetFundamentalNote: '3F#',
  targetTopLugHz: 252.0,      // Batter lug
  targetBottomLugHz: 378.0,   // Resonant lug (1.5x)
  resonance: 'medium',
  headBias: 'bottom-higher',
  x: 20,
  y: 52,
  radius: 38,
};

// Standard 22" Kick drum (Bass drum) based on Guide Page 6
// Resonant head lug pitch is a perfect fifth (1.5x) higher than batter head lug pitch
export const STANDARD_KICK: DrumItem = {
  id: 'kick-22',
  name: '22" 킥 드럼',
  label: 'K',
  type: 'bass',
  sizeInches: 22,
  targetFundamentalHz: 38.9,  // 1D#
  targetFundamentalNote: '1D#',
  targetTopLugHz: 58.0,       // Batter lug
  targetBottomLugHz: 87.0,    // Resonant lug (1.5x, Perfect Fifth)
  resonance: 'medium',
  headBias: 'bottom-higher',
  x: 50,
  y: 48,
  radius: 46,
};

// Builder for any tom count (2 ~ 6 toms)
// 6탐 (7기통: 6탐 + 킥), 5탐 (6기통: 5탐 + 킥), 4탐 (5기통: 4탐 + 킥), 3탐 (4기통: 3탐 + 킥), 2탐 (3기통: 2탐 + 킥)
// 항상 14" 표준 스네어와 22" 킥 드럼이 포함됩니다.
export function getKitByTomCount(numToms: number): DrumItem[] {
  if (numToms === 6) {
    // 6탐 (7기통: 6탐 + 1킥): 8", 10", 12", 13", 14", 16"
    return [
      {
        id: 'tom-8',
        name: '8" 랙 탐',
        label: '8',
        type: 'rack-tom',
        sizeInches: 8,
        targetFundamentalHz: 207.7,
        targetFundamentalNote: '3G#',
        targetTopLugHz: 290.8,
        targetBottomLugHz: 415.4,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 18,
        y: 18,
        radius: 28,
      },
      {
        id: 'tom-10',
        name: '10" 랙 탐',
        label: '10',
        type: 'rack-tom',
        sizeInches: 10,
        targetFundamentalHz: 164.8,
        targetFundamentalNote: '3E',
        targetTopLugHz: 230.7,
        targetBottomLugHz: 329.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 38,
        y: 16,
        radius: 32,
      },
      {
        id: 'tom-12',
        name: '12" 랙 탐',
        label: '12',
        type: 'rack-tom',
        sizeInches: 12,
        targetFundamentalHz: 130.8,
        targetFundamentalNote: '3C',
        targetTopLugHz: 183.1,
        targetBottomLugHz: 261.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 62,
        y: 16,
        radius: 36,
      },
      {
        id: 'tom-13',
        name: '13" 랙 탐',
        label: '13',
        type: 'rack-tom',
        sizeInches: 13,
        targetFundamentalHz: 103.8,
        targetFundamentalNote: '2G#',
        targetTopLugHz: 145.3,
        targetBottomLugHz: 207.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 82,
        y: 18,
        radius: 38,
      },
      STANDARD_SNARE,
      STANDARD_KICK,
      {
        id: 'tom-14',
        name: '14" 플로어 탐',
        label: '14',
        type: 'floor-tom',
        sizeInches: 14,
        targetFundamentalHz: 82.4,
        targetFundamentalNote: '2E',
        targetTopLugHz: 115.4,
        targetBottomLugHz: 164.8,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 84,
        y: 50,
        radius: 42,
      },
      {
        id: 'tom-16',
        name: '16" 플로어 탐',
        label: '16',
        type: 'floor-tom',
        sizeInches: 16,
        targetFundamentalHz: 65.4,
        targetFundamentalNote: '2C',
        targetTopLugHz: 91.6,
        targetBottomLugHz: 130.8,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 76,
        y: 82,
        radius: 46,
      },
    ];
  } else if (numToms === 5) {
    // 5탐 (6기통: 5탐 + 1킥): 8", 10", 12", 14", 16"
    return [
      {
        id: 'tom-8',
        name: '8" 랙 탐',
        label: '8',
        type: 'rack-tom',
        sizeInches: 8,
        targetFundamentalHz: 207.7,
        targetFundamentalNote: '3G#',
        targetTopLugHz: 290.8,
        targetBottomLugHz: 415.4,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 18,
        y: 18,
        radius: 28,
      },
      {
        id: 'tom-10',
        name: '10" 랙 탐',
        label: '10',
        type: 'rack-tom',
        sizeInches: 10,
        targetFundamentalHz: 164.8,
        targetFundamentalNote: '3E',
        targetTopLugHz: 230.7,
        targetBottomLugHz: 329.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 40,
        y: 16,
        radius: 32,
      },
      {
        id: 'tom-12',
        name: '12" 랙 탐',
        label: '12',
        type: 'rack-tom',
        sizeInches: 12,
        targetFundamentalHz: 130.8,
        targetFundamentalNote: '3C',
        targetTopLugHz: 183.1,
        targetBottomLugHz: 261.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 66,
        y: 18,
        radius: 36,
      },
      STANDARD_SNARE,
      STANDARD_KICK,
      {
        id: 'tom-14',
        name: '14" 플로어 탐',
        label: '14',
        type: 'floor-tom',
        sizeInches: 14,
        targetFundamentalHz: 103.8,
        targetFundamentalNote: '2G#',
        targetTopLugHz: 145.3,
        targetBottomLugHz: 207.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 82,
        y: 48,
        radius: 42,
      },
      {
        id: 'tom-16',
        name: '16" 플로어 탐',
        label: '16',
        type: 'floor-tom',
        sizeInches: 16,
        targetFundamentalHz: 82.4,
        targetFundamentalNote: '2E',
        targetTopLugHz: 115.4,
        targetBottomLugHz: 164.8,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 76,
        y: 80,
        radius: 46,
      },
    ];
  } else if (numToms === 4) {
    // 4탐 (5기통: 4탐 + 1킥): 10", 12", 14", 16"
    return [
      {
        id: 'tom-10',
        name: '10" 랙 탐',
        label: '10',
        type: 'rack-tom',
        sizeInches: 10,
        targetFundamentalHz: 146.8,
        targetFundamentalNote: '3D',
        targetTopLugHz: 205.5,
        targetBottomLugHz: 293.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 36,
        y: 18,
        radius: 34,
      },
      {
        id: 'tom-12',
        name: '12" 랙 탐',
        label: '12',
        type: 'rack-tom',
        sizeInches: 12,
        targetFundamentalHz: 123.5,
        targetFundamentalNote: '2B',
        targetTopLugHz: 172.9,
        targetBottomLugHz: 247.0,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 64,
        y: 18,
        radius: 38,
      },
      STANDARD_SNARE,
      STANDARD_KICK,
      {
        id: 'tom-14',
        name: '14" 플로어 탐',
        label: '14',
        type: 'floor-tom',
        sizeInches: 14,
        targetFundamentalHz: 98.0,
        targetFundamentalNote: '2G',
        targetTopLugHz: 137.2,
        targetBottomLugHz: 196.0,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 82,
        y: 46,
        radius: 42,
      },
      {
        id: 'tom-16',
        name: '16" 플로어 탐',
        label: '16',
        type: 'floor-tom',
        sizeInches: 16,
        targetFundamentalHz: 73.4,
        targetFundamentalNote: '2D',
        targetTopLugHz: 102.8,
        targetBottomLugHz: 146.8,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 76,
        y: 80,
        radius: 46,
      },
    ];
  } else if (numToms === 3) {
    // 3탐 (4기통: 3탐 + 1킥): 10", 12", 14"
    return [
      {
        id: 'tom-10',
        name: '10" 랙 탐',
        label: '10',
        type: 'rack-tom',
        sizeInches: 10,
        targetFundamentalHz: 130.8,
        targetFundamentalNote: '3C',
        targetTopLugHz: 183.1,
        targetBottomLugHz: 261.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 38,
        y: 18,
        radius: 34,
      },
      {
        id: 'tom-12',
        name: '12" 랙 탐',
        label: '12',
        type: 'rack-tom',
        sizeInches: 12,
        targetFundamentalHz: 110.0,
        targetFundamentalNote: '2A',
        targetTopLugHz: 154.0,
        targetBottomLugHz: 220.0,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 64,
        y: 18,
        radius: 38,
      },
      STANDARD_SNARE,
      STANDARD_KICK,
      {
        id: 'tom-14',
        name: '14" 플로어 탐',
        label: '14',
        type: 'floor-tom',
        sizeInches: 14,
        targetFundamentalHz: 87.3,
        targetFundamentalNote: '2F',
        targetTopLugHz: 122.2,
        targetBottomLugHz: 174.6,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 82,
        y: 52,
        radius: 42,
      },
    ];
  } else {
    // 2탐 (3기통: 2탐 + 1킥): 12", 16"
    return [
      {
        id: 'tom-12',
        name: '12" 랙 탐',
        label: '12',
        type: 'rack-tom',
        sizeInches: 12,
        targetFundamentalHz: 110.0,
        targetFundamentalNote: '2A',
        targetTopLugHz: 154.0,
        targetBottomLugHz: 220.0,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 50,
        y: 18,
        radius: 38,
      },
      STANDARD_SNARE,
      STANDARD_KICK,
      {
        id: 'tom-16',
        name: '16" 플로어 탐',
        label: '16',
        type: 'floor-tom',
        sizeInches: 16,
        targetFundamentalHz: 73.4,
        targetFundamentalNote: '2D',
        targetTopLugHz: 102.8,
        targetBottomLugHz: 146.8,
        resonance: 'medium',
        headBias: 'bottom-higher',
        x: 80,
        y: 60,
        radius: 46,
      },
    ];
  }
}

// Helper to build kit strictly matching real drumming piece counts (탐 + 킥 = 기통)
export function getKitByPieceCount(pieceCount: number): DrumItem[] {
  // 7기통 -> 6탐 + 1킥
  // 6기통 -> 5탐 + 1킥
  // 5기통 -> 4탐 + 1킥
  // 4기통 -> 3탐 + 1킥
  // 3기통 -> 2탐 + 1킥
  const numToms = Math.max(2, Math.min(6, pieceCount - 1));
  return getKitByTomCount(numToms);
}

// Default Full Kit: 6기통 (5탐 + 킥 + 14" 스네어)
export const DEFAULT_DRUM_KIT: DrumItem[] = getKitByTomCount(5);

