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
    // top-higher: switch multipliers
    return {
      topLugHz: Math.round(fundHz * mult.bottom * 10) / 10,
      bottomLugHz: Math.round(fundHz * mult.top * 10) / 10,
    };
  }
}

// Pre-defined Interval Types from Tuning Guide
export const INTERVAL_TYPES = [
  { id: 'thirds', name: 'Major Thirds (장 3도)', desc: '4개 이상 탐에 최적화, 1옥타브 내 고른 분포 (4반음)', semitones: 4 },
  { id: 'fourths', name: 'Perfect Fourths (완전 4도)', desc: '넓은 음역대 커버, 4탐 추천 (5반음)', semitones: 5 },
  { id: 'fifths', name: 'Perfect Fifths (완전 5도)', desc: '2~3개 탐에 최적화, 깔끔하고 명확한 음정 (7반음)', semitones: 7 },
  { id: 'majorChord', name: 'Major Chord (메이저 화음)', desc: '근음 - 3도 - 5도 3화음 조합, 3탐 추천', semitones: [0, 4, 7] },
  { id: 'callToPost', name: 'Call to the Post (경마 나팔송)', desc: '5, 4, 3 반음 간격의 전설적 록/팝 튜닝', semitones: [0, 5, 9, 12] },
];

// Presets from Table 1 of the Guide
export const TUNING_PRESETS: TuningGuidePreset[] = [
  {
    id: 'toms-6-thirds',
    name: '6 Toms - Major Thirds',
    koreanName: '6탐 - 장3도 화음 (8"~16")',
    numToms: 6,
    intervalType: 'Major Thirds',
    rootNote: '3G#',
    toms: [
      { size: 8, fundamentalNote: '3G#', fundamentalHz: 208.0 },
      { size: 10, fundamentalNote: '3E', fundamentalHz: 165.0 },
      { size: 12, fundamentalNote: '3C', fundamentalHz: 131.0 },
      { size: 13, fundamentalNote: '2G#', fundamentalHz: 104.0 },
      { size: 14, fundamentalNote: '2E', fundamentalHz: 82.4 },
      { size: 16, fundamentalNote: '2C', fundamentalHz: 65.4 },
    ],
  },
  {
    id: 'toms-5-thirds',
    name: '5 Toms - Major Thirds',
    koreanName: '5탐 - 장3도 화음 (8", 10", 12", 14", 16")',
    numToms: 5,
    intervalType: 'Major Thirds',
    rootNote: '3G#',
    toms: [
      { size: 8, fundamentalNote: '3G#', fundamentalHz: 208.0 },
      { size: 10, fundamentalNote: '3E', fundamentalHz: 165.0 },
      { size: 12, fundamentalNote: '3C', fundamentalHz: 131.0 },
      { size: 14, fundamentalNote: '2G#', fundamentalHz: 104.0 },
      { size: 16, fundamentalNote: '2E', fundamentalHz: 82.4 },
    ],
  },
  {
    id: 'toms-4-post',
    name: '4 Toms - Call to the Post',
    koreanName: '4탐 - Call to Post (10", 12", 14", 16")',
    numToms: 4,
    intervalType: 'Call to Post',
    rootNote: '3D',
    toms: [
      { size: 10, fundamentalNote: '3D', fundamentalHz: 147.0 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 124.0 },
      { size: 14, fundamentalNote: '2G', fundamentalHz: 98.0 },
      { size: 16, fundamentalNote: '2D', fundamentalHz: 73.4 },
    ],
  },
  {
    id: 'toms-4-fourths',
    name: '4 Toms - Perfect Fourths',
    koreanName: '4탐 - 완전4도 화음 (10", 12", 14", 16")',
    numToms: 4,
    intervalType: 'Perfect Fourths',
    rootNote: '3E',
    toms: [
      { size: 10, fundamentalNote: '3E', fundamentalHz: 165.0 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 124.0 },
      { size: 14, fundamentalNote: '2F#', fundamentalHz: 92.5 },
      { size: 16, fundamentalNote: '2C#', fundamentalHz: 69.3 },
    ],
  },
  {
    id: 'toms-3-chord',
    name: '3 Toms - Major Chord',
    koreanName: '3탐 - 메이저 코드 (10", 12", 14")',
    numToms: 3,
    intervalType: 'Major Chord',
    rootNote: '3C',
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 131.0 },
      { size: 12, fundamentalNote: '2A', fundamentalHz: 110.0 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
    ],
  },
  {
    id: 'toms-2-fifths',
    name: '2 Toms - Perfect Fifth',
    koreanName: '2탐 - 완전5도 (10", 14")',
    numToms: 2,
    intervalType: 'Perfect Fifth',
    rootNote: '3C',
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 131.0 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
    ],
  },
];

// Default 6-piece Kit matching '배치.png' and 'front.png'
// (8", 10", 12", Snare 'S', 14", 16")
export const DEFAULT_DRUM_KIT: DrumItem[] = [
  {
    id: 'tom-8',
    name: '8" Rack Tom',
    label: '8',
    type: 'rack-tom',
    sizeInches: 8,
    targetFundamentalHz: 208.0,
    targetFundamentalNote: '3G#',
    targetTopLugHz: 291.2,
    targetBottomLugHz: 416.0,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 18,
    y: 18,
    radius: 36,
  },
  {
    id: 'tom-10',
    name: '10" Rack Tom',
    label: '10',
    type: 'rack-tom',
    sizeInches: 10,
    targetFundamentalHz: 165.0,
    targetFundamentalNote: '3E',
    targetTopLugHz: 231.0,
    targetBottomLugHz: 330.0,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 42,
    y: 16,
    radius: 42,
  },
  {
    id: 'tom-12',
    name: '12" Rack Tom',
    label: '12',
    type: 'rack-tom',
    sizeInches: 12,
    targetFundamentalHz: 131.0,
    targetFundamentalNote: '3C',
    targetTopLugHz: 183.4,
    targetBottomLugHz: 262.0,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 72,
    y: 18,
    radius: 48,
  },
  {
    id: 'snare-14',
    name: '14" Snare Drum',
    label: 'S',
    type: 'snare',
    sizeInches: 14,
    targetFundamentalHz: 185.0, // 3F#
    targetFundamentalNote: '3F#',
    targetTopLugHz: 252.0,
    targetBottomLugHz: 378.0,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 28,
    y: 48,
    radius: 50,
  },
  {
    id: 'tom-14',
    name: '14" Floor Tom',
    label: '14',
    type: 'floor-tom',
    sizeInches: 14,
    targetFundamentalHz: 98.0,
    targetFundamentalNote: '2G',
    targetTopLugHz: 137.2,
    targetBottomLugHz: 196.0,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 68,
    y: 50,
    radius: 54,
  },
  {
    id: 'tom-16',
    name: '16" Floor Tom',
    label: '16',
    type: 'floor-tom',
    sizeInches: 16,
    targetFundamentalHz: 73.4,
    targetFundamentalNote: '2D',
    targetTopLugHz: 102.8,
    targetBottomLugHz: 146.8,
    resonance: 'medium',
    headBias: 'bottom-higher',
    x: 78,
    y: 82,
    radius: 60,
  },
];
