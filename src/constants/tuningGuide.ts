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

// Presets from Table 1 of the Tune-Bot Tuning Guide (Page 2)
// Total Pieces (기통수 = 탐 개수 + 14" 스네어 1개 + 22" 킥 1개):
// 8기통 = 6탐 (8, 10, 12, 13, 14, 16) + S + K
// 7기통 = 5탐 (8, 10, 12, 14, 16) + S + K
// 6기통 = 4탐 (10, 12, 14, 16) + S + K
// 5기통 = 3탐 (10, 12, 14 또는 10, 12, 16) + S + K
// 4기통 = 2탐 (12, 16 또는 10, 14) + S + K
export const TUNING_PRESETS: TuningGuidePreset[] = [
  // 1순위: Table 1 Col 3: 3 toms (총 5기통) - Major Chord (10, 12, 14) [전 세계 가장 대중적인 표준]
  {
    id: 'toms-3-chord',
    name: '5기통 - 장조 화음 (10, 12, 14)',
    koreanName: '5기통 - 장조 화음 (10, 12, 14)',
    numToms: 3,
    intervalType: 'Major Chord',
    rootNote: '3C',
    resonance: 'high',
    tag: '표준',
    popular: true,
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 12, fundamentalNote: '2A', fundamentalHz: 110.0 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
    ],
  },
  // 2순위: Table 1 Col 4: 3 toms (총 5기통) - Perfect Fourths (10, 12, 16) [록/팝 펀치감 표준]
  {
    id: 'toms-3-fourths',
    name: '5기통 - 완전4도 (10, 12, 16)',
    koreanName: '5기통 - 완전4도 (10, 12, 16)',
    numToms: 3,
    intervalType: 'Perfect Fourths',
    rootNote: '3C',
    resonance: 'high',
    tag: '록/팝 추천',
    popular: true,
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 12, fundamentalNote: '2G', fundamentalHz: 98.0 },
      { size: 16, fundamentalNote: '2D', fundamentalHz: 73.4 },
    ],
  },
  // 3순위: Table 1 Col 7: 4 toms (총 6기통) - Call to Post (10, 12, 14, 16) [모던 록/워십 대표 튜닝]
  {
    id: 'toms-4-post',
    name: '6기통 - Call to Post (10, 12, 14, 16)',
    koreanName: '6기통 - Call to Post (10, 12, 14, 16)',
    numToms: 4,
    intervalType: 'Call to Post',
    rootNote: '3D',
    resonance: 'high',
    tag: '6기통 추천',
    popular: true,
    toms: [
      { size: 10, fundamentalNote: '3D', fundamentalHz: 146.8 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 123.5 },
      { size: 14, fundamentalNote: '2G', fundamentalHz: 98.0 },
      { size: 16, fundamentalNote: '2D', fundamentalHz: 73.4 },
    ],
  },
  // 4순위: Table 1 Col 8: 4 toms (총 6기통) - Perfect Fourths (10, 12, 14, 16)
  {
    id: 'toms-4-fourths',
    name: '6기통 - 완전4도',
    koreanName: '6기통 - 완전4도',
    numToms: 4,
    intervalType: 'Perfect Fourths',
    rootNote: '3E',
    resonance: 'high',
    tag: '넓은 음역',
    toms: [
      { size: 10, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 12, fundamentalNote: '2B', fundamentalHz: 123.5 },
      { size: 14, fundamentalNote: '2F#', fundamentalHz: 92.5 },
      { size: 16, fundamentalNote: '2C#', fundamentalHz: 69.3 },
    ],
  },
  // 5순위: Table 1 Col 2: 2 toms (총 4기통) - Perfect Fifth (12, 16 표준) [빈티지/록 4기통]
  {
    id: 'toms-2-fifths-12-16',
    name: '4기통 - 완전5도 (12, 16 표준)',
    koreanName: '4기통 - 완전5도 (12, 16 표준)',
    numToms: 2,
    intervalType: 'Perfect Fifth',
    rootNote: '2A',
    resonance: 'high',
    tag: '빈티지 록',
    toms: [
      { size: 12, fundamentalNote: '2A', fundamentalHz: 110.0 },
      { size: 16, fundamentalNote: '2D', fundamentalHz: 73.4 },
    ],
  },
  // 6순위: Table 1 Col 1: 2 toms (총 4기통) - Perfect Fifth (10, 14 재즈) [재즈/클럽/소구경]
  {
    id: 'toms-2-fifths-10-14',
    name: '4기통 - 완전5도 (10, 14 재즈)',
    koreanName: '4기통 - 완전5도 (10, 14 재즈)',
    numToms: 2,
    intervalType: 'Perfect Fifth',
    rootNote: '3C',
    resonance: 'high',
    tag: '재즈/클럽',
    toms: [
      { size: 10, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
    ],
  },
  // 7순위: Table 1 Col 5: 3 toms (총 5기통) - Major Thirds (12, 14, 16)
  {
    id: 'toms-3-thirds',
    name: '5기통 - 장3도 (12, 14, 16)',
    koreanName: '5기통 - 장3도 (12, 14, 16)',
    numToms: 3,
    intervalType: 'Major Thirds',
    rootNote: '2A',
    resonance: 'high',
    tag: '1랙 2플로어',
    toms: [
      { size: 12, fundamentalNote: '2A', fundamentalHz: 110.0 },
      { size: 14, fundamentalNote: '2F', fundamentalHz: 87.3 },
      { size: 16, fundamentalNote: '2C#', fundamentalHz: 69.3 },
    ],
  },
  // 8순위: Table 1 Col 9: 5 toms (총 7기통) - Major Thirds (8, 10, 12, 14, 16) [5탐 확장 세트]
  {
    id: 'toms-5-thirds',
    name: '7기통 - 장3도 (5탐 확장)',
    koreanName: '7기통 - 장3도 (5탐 확장)',
    numToms: 5,
    intervalType: 'Major Thirds',
    rootNote: '3E',
    resonance: 'high',
    tag: '확장 5탐',
    toms: [
      { size: 8, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 10, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 12, fundamentalNote: '2G#', fundamentalHz: 103.8 },
      { size: 14, fundamentalNote: '2E', fundamentalHz: 82.4 },
      { size: 16, fundamentalNote: '2C', fundamentalHz: 65.4 },
    ],
  },
  // 9순위: Table 1 Col 10: 6 toms (총 8기통) - Major Thirds (8, 10, 12, 13, 14, 16) [대형 커스텀 킷]
  {
    id: 'toms-6-scale',
    name: '8기통 - 장3도 (6탐 풀세트)',
    koreanName: '8기통 - 장3도 (6탐 풀세트)',
    numToms: 6,
    intervalType: 'Major Thirds',
    rootNote: '3G#',
    resonance: 'high',
    tag: '풀세트 8기통',
    toms: [
      { size: 8, fundamentalNote: '3G#', fundamentalHz: 207.7 },
      { size: 10, fundamentalNote: '3E', fundamentalHz: 164.8 },
      { size: 12, fundamentalNote: '3C', fundamentalHz: 130.8 },
      { size: 13, fundamentalNote: '2G#', fundamentalHz: 103.8 },
      { size: 14, fundamentalNote: '2E', fundamentalHz: 82.4 },
      { size: 16, fundamentalNote: '2C', fundamentalHz: 65.4 },
    ],
  },
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
  resonance: 'high',
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
  resonance: 'high',
  headBias: 'bottom-higher',
  x: 50,
  y: 48,
  radius: 46,
};

// Builder for any tom count (2 ~ 6 toms)
// Defaults to 'high' resonance (Top: 1.5x, Bottom: 1.85x)
export function getKitByTomCount(
  numToms: number,
  resonance: ResonanceType = 'high',
  headBias: HeadBias = 'bottom-higher'
): DrumItem[] {
  const calc = (fundHz: number) => calculateLugFrequencies(fundHz, resonance, headBias);

  const snare: DrumItem = { ...STANDARD_SNARE, resonance, headBias };
  const kick: DrumItem = { ...STANDARD_KICK, resonance, headBias };

  if (numToms === 6) {
    // 8기통 (6탐 + 킥 + 스네어): 8", 10", 12", 13", 14", 16"
    const t8 = calc(207.7);
    const t10 = calc(164.8);
    const t12 = calc(130.8);
    const t13 = calc(103.8);
    const t14 = calc(82.4);
    const t16 = calc(65.4);
    return [
      { id: 'tom-8', name: '8" 랙 탐', label: '8', type: 'rack-tom', sizeInches: 8, targetFundamentalHz: 207.7, targetFundamentalNote: '3G#', targetTopLugHz: t8.topLugHz, targetBottomLugHz: t8.bottomLugHz, resonance, headBias, x: 18, y: 18, radius: 28 },
      { id: 'tom-10', name: '10" 랙 탐', label: '10', type: 'rack-tom', sizeInches: 10, targetFundamentalHz: 164.8, targetFundamentalNote: '3E', targetTopLugHz: t10.topLugHz, targetBottomLugHz: t10.bottomLugHz, resonance, headBias, x: 38, y: 16, radius: 32 },
      { id: 'tom-12', name: '12" 랙 탐', label: '12', type: 'rack-tom', sizeInches: 12, targetFundamentalHz: 130.8, targetFundamentalNote: '3C', targetTopLugHz: t12.topLugHz, targetBottomLugHz: t12.bottomLugHz, resonance, headBias, x: 62, y: 16, radius: 36 },
      { id: 'tom-13', name: '13" 랙 탐', label: '13', type: 'rack-tom', sizeInches: 13, targetFundamentalHz: 103.8, targetFundamentalNote: '2G#', targetTopLugHz: t13.topLugHz, targetBottomLugHz: t13.bottomLugHz, resonance, headBias, x: 82, y: 18, radius: 38 },
      snare,
      kick,
      { id: 'tom-14', name: '14" 플로어 탐', label: '14', type: 'floor-tom', sizeInches: 14, targetFundamentalHz: 82.4, targetFundamentalNote: '2E', targetTopLugHz: t14.topLugHz, targetBottomLugHz: t14.bottomLugHz, resonance, headBias, x: 84, y: 50, radius: 42 },
      { id: 'tom-16', name: '16" 플로어 탐', label: '16', type: 'floor-tom', sizeInches: 16, targetFundamentalHz: 65.4, targetFundamentalNote: '2C', targetTopLugHz: t16.topLugHz, targetBottomLugHz: t16.bottomLugHz, resonance, headBias, x: 76, y: 82, radius: 46 },
    ];
  } else if (numToms === 5) {
    // 7기통 (5탐 + 킥 + 스네어): 8", 10", 12", 14", 16" - Table 1 Col 9 Major Thirds
    const t8 = calc(164.8);
    const t10 = calc(130.8);
    const t12 = calc(103.8);
    const t14 = calc(82.4);
    const t16 = calc(65.4);
    return [
      { id: 'tom-8', name: '8" 랙 탐', label: '8', type: 'rack-tom', sizeInches: 8, targetFundamentalHz: 164.8, targetFundamentalNote: '3E', targetTopLugHz: t8.topLugHz, targetBottomLugHz: t8.bottomLugHz, resonance, headBias, x: 18, y: 18, radius: 28 },
      { id: 'tom-10', name: '10" 랙 탐', label: '10', type: 'rack-tom', sizeInches: 10, targetFundamentalHz: 130.8, targetFundamentalNote: '3C', targetTopLugHz: t10.topLugHz, targetBottomLugHz: t10.bottomLugHz, resonance, headBias, x: 40, y: 16, radius: 32 },
      { id: 'tom-12', name: '12" 랙 탐', label: '12', type: 'rack-tom', sizeInches: 12, targetFundamentalHz: 103.8, targetFundamentalNote: '2G#', targetTopLugHz: t12.topLugHz, targetBottomLugHz: t12.bottomLugHz, resonance, headBias, x: 66, y: 18, radius: 36 },
      snare,
      kick,
      { id: 'tom-14', name: '14" 플로어 탐', label: '14', type: 'floor-tom', sizeInches: 14, targetFundamentalHz: 82.4, targetFundamentalNote: '2E', targetTopLugHz: t14.topLugHz, targetBottomLugHz: t14.bottomLugHz, resonance, headBias, x: 82, y: 48, radius: 42 },
      { id: 'tom-16', name: '16" 플로어 탐', label: '16', type: 'floor-tom', sizeInches: 16, targetFundamentalHz: 65.4, targetFundamentalNote: '2C', targetTopLugHz: t16.topLugHz, targetBottomLugHz: t16.bottomLugHz, resonance, headBias, x: 76, y: 80, radius: 46 },
    ];
  } else if (numToms === 4) {
    // 6기통 (4탐 + 킥 + 스네어): 10", 12", 14", 16"
    const t10 = calc(146.8);
    const t12 = calc(123.5);
    const t14 = calc(98.0);
    const t16 = calc(73.4);
    return [
      { id: 'tom-10', name: '10" 랙 탐', label: '10', type: 'rack-tom', sizeInches: 10, targetFundamentalHz: 146.8, targetFundamentalNote: '3D', targetTopLugHz: t10.topLugHz, targetBottomLugHz: t10.bottomLugHz, resonance, headBias, x: 36, y: 18, radius: 34 },
      { id: 'tom-12', name: '12" 랙 탐', label: '12', type: 'rack-tom', sizeInches: 12, targetFundamentalHz: 123.5, targetFundamentalNote: '2B', targetTopLugHz: t12.topLugHz, targetBottomLugHz: t12.bottomLugHz, resonance, headBias, x: 64, y: 18, radius: 38 },
      snare,
      kick,
      { id: 'tom-14', name: '14" 플로어 탐', label: '14', type: 'floor-tom', sizeInches: 14, targetFundamentalHz: 98.0, targetFundamentalNote: '2G', targetTopLugHz: t14.topLugHz, targetBottomLugHz: t14.bottomLugHz, resonance, headBias, x: 82, y: 46, radius: 42 },
      { id: 'tom-16', name: '16" 플로어 탐', label: '16', type: 'floor-tom', sizeInches: 16, targetFundamentalHz: 73.4, targetFundamentalNote: '2D', targetTopLugHz: t16.topLugHz, targetBottomLugHz: t16.bottomLugHz, resonance, headBias, x: 76, y: 80, radius: 46 },
    ];
  } else if (numToms === 3) {
    // 5기통 (3탐 + 킥 + 스네어): 10", 12", 14"
    const t10 = calc(130.8);
    const t12 = calc(110.0);
    const t14 = calc(87.3);
    return [
      { id: 'tom-10', name: '10" 랙 탐', label: '10', type: 'rack-tom', sizeInches: 10, targetFundamentalHz: 130.8, targetFundamentalNote: '3C', targetTopLugHz: t10.topLugHz, targetBottomLugHz: t10.bottomLugHz, resonance, headBias, x: 38, y: 18, radius: 34 },
      { id: 'tom-12', name: '12" 랙 탐', label: '12', type: 'rack-tom', sizeInches: 12, targetFundamentalHz: 110.0, targetFundamentalNote: '2A', targetTopLugHz: t12.topLugHz, targetBottomLugHz: t12.bottomLugHz, resonance, headBias, x: 64, y: 18, radius: 38 },
      snare,
      kick,
      { id: 'tom-14', name: '14" 플로어 탐', label: '14', type: 'floor-tom', sizeInches: 14, targetFundamentalHz: 87.3, targetFundamentalNote: '2F', targetTopLugHz: t14.topLugHz, targetBottomLugHz: t14.bottomLugHz, resonance, headBias, x: 82, y: 52, radius: 42 },
    ];
  } else {
    // 4기통 (2탐 + 킥 + 스네어): 12", 16"
    const t12 = calc(110.0);
    const t16 = calc(73.4);
    return [
      { id: 'tom-12', name: '12" 랙 탐', label: '12', type: 'rack-tom', sizeInches: 12, targetFundamentalHz: 110.0, targetFundamentalNote: '2A', targetTopLugHz: t12.topLugHz, targetBottomLugHz: t12.bottomLugHz, resonance, headBias, x: 50, y: 18, radius: 38 },
      snare,
      kick,
      { id: 'tom-16', name: '16" 플로어 탐', label: '16', type: 'floor-tom', sizeInches: 16, targetFundamentalHz: 73.4, targetFundamentalNote: '2D', targetTopLugHz: t16.topLugHz, targetBottomLugHz: t16.bottomLugHz, resonance, headBias, x: 80, y: 60, radius: 46 },
    ];
  }
}

// Helper to build kit strictly matching real drumming piece counts
export function getKitByPieceCount(pieceCount: number, resonance: ResonanceType = 'high'): DrumItem[] {
  const numToms = Math.max(2, Math.min(6, pieceCount - 2));
  return getKitByTomCount(numToms, resonance);
}

// Default Full Kit: 7기통 (5탐 + 1킥 + 1스네어) with 'high' resonance
export const DEFAULT_DRUM_KIT: DrumItem[] = getKitByTomCount(5, 'high');

