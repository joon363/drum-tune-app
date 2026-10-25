export type ResonanceType = 'max' | 'high' | 'medium' | 'low';

export type HeadBias = 'bottom-higher' | 'top-higher' | 'equal';

export type DrumType = 'rack-tom' | 'floor-tom' | 'snare' | 'bass';

export interface DrumItem {
  id: string;
  name: string;
  type: DrumType;
  sizeInches: number;
  label: string;
  // Fundamental target
  targetFundamentalHz: number;
  targetFundamentalNote: string;
  // Top (Batter) & Bottom (Resonant) lug targets
  targetTopLugHz: number;
  targetBottomLugHz: number;
  // Resonance setting
  resonance: ResonanceType;
  headBias: HeadBias;
  // Position in UI (percentage coordinates or grid)
  x: number;
  y: number;
  radius: number;
}

export type TuningTargetHead = 'top' | 'bottom';
export type TuningMode = 'lug' | 'fundamental';

export interface TuningGuidePreset {
  id: string;
  name: string;
  koreanName: string;
  numToms: number;
  intervalType: string;
  rootNote: string;
  toms: {
    size: number;
    fundamentalNote: string;
    fundamentalHz: number;
  }[];
}

export interface DetectedPitchInfo {
  frequency: number;
  note: string;
  cents: number;
  clarity: number;
  timestamp: number;
  subharmonicHz?: number;
  fifthHarmonicHz?: number;
  overtoneHz?: number;
}
