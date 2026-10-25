import { NOTE_NAMES, BASE_NOTE_FREQUENCIES } from '../constants/tuningGuide';
import { DetectedPitchInfo } from '../types';

/**
 * Converts frequency in Hz to musical note name and cents offset (A4 = 440Hz)
 */
export function frequencyToNote(freq: number, refA4: number = 440): {
  note: string;
  octave: number;
  fullName: string;
  cents: number;
  exactFreq: number;
} {
  if (freq <= 10) {
    return { note: '--', octave: 0, fullName: '--', cents: 0, exactFreq: 0 };
  }

  // MIDI note number: 69 is A4 (440Hz)
  const midi = 69 + 12 * Math.log2(freq / refA4);
  const roundedMidi = Math.round(midi);
  const cents = Math.round((midi - roundedMidi) * 100);

  // MIDI 12 is C0, MIDI 24 is C1, etc.
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const exactFreq = refA4 * Math.pow(2, (roundedMidi - 69) / 12);

  // In Tune-bot guide style, it writes "3C", "2A", "3C#" (octave first or note+octave)
  // Let's provide "C3#" or "3C#" format nicely
  return {
    note: noteName,
    octave,
    fullName: `${octave}${noteName}`,
    cents,
    exactFreq,
  };
}

/**
 * Calculates cents difference between detected frequency and target frequency
 */
export function calculateCentsDifference(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0;
  return Math.round(1200 * Math.log2(detectedHz / targetHz));
}

/**
 * Parabolic interpolation for fine sub-bin frequency detection in FFT
 */
export function parabolicPeakInterpolation(
  data: Float32Array,
  peakIndex: number,
  sampleRate: number,
  fftSize: number
): { freq: number; magnitude: number } {
  if (peakIndex <= 0 || peakIndex >= data.length - 1) {
    return { freq: (peakIndex * sampleRate) / fftSize, magnitude: data[peakIndex] };
  }

  const alpha = data[peakIndex - 1];
  const beta = data[peakIndex];
  const gamma = data[peakIndex + 1];

  const delta = (0.5 * (alpha - gamma)) / (alpha - 2 * beta + gamma + 1e-10);
  const trueIndex = peakIndex - delta;
  const freq = (trueIndex * sampleRate) / fftSize;
  const magnitude = beta - 0.25 * (alpha - gamma) * delta;

  return { freq, magnitude };
}

/**
 * Detects the dominant peak frequency directly from the FFT spectrum (highest intensity).
 * Directly matches the brightest peak visible on the spectrometer.
 * Parabolic interpolation provides sub-bin precision (0.1 Hz accuracy).
 */
export function detectPeakFrequencyFromFFT(
  floatFreqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  options: {
    minHz?: number;
    maxHz?: number;
    filterCenterHz?: number;
    filterBandwidthPct?: number;
    filterEnabled?: boolean;
    minDbThreshold?: number;
  } = {}
): { frequency: number; magnitude: number; clarity: number } | null {
  const minHz = options.minHz ?? 30;
  const maxHz = options.maxHz ?? 650;
  const filterEnabled = options.filterEnabled ?? false;
  const filterCenterHz = options.filterCenterHz;
  const filterBandwidthPct = options.filterBandwidthPct ?? 0.25;
  const minDbThreshold = options.minDbThreshold ?? -70; // dB

  const binHz = sampleRate / fftSize;
  const binCount = floatFreqData.length;

  let startHz = minHz;
  let endHz = maxHz;

  if (filterEnabled && filterCenterHz && filterCenterHz > 0) {
    startHz = Math.max(minHz, filterCenterHz * (1 - filterBandwidthPct));
    endHz = Math.min(maxHz, filterCenterHz * (1 + filterBandwidthPct));
  }

  const startBin = Math.max(1, Math.floor(startHz / binHz));
  const endBin = Math.min(binCount - 2, Math.ceil(endHz / binHz));

  if (startBin >= endBin) return null;

  // Find the bin with the highest magnitude (peak intensity) in the spectrum
  let maxDb = -Infinity;
  let peakBin = -1;

  for (let b = startBin; b <= endBin; b++) {
    const val = floatFreqData[b];
    if (val > maxDb) {
      maxDb = val;
      peakBin = b;
    }
  }

  // Reject if below minimum dB threshold
  if (maxDb < minDbThreshold || peakBin <= 0) {
    return null;
  }

  const alpha = floatFreqData[peakBin - 1];
  const beta = floatFreqData[peakBin];
  const gamma = floatFreqData[peakBin + 1];

  // Peak prominence check (must stick out above neighbor bins by at least 1.5 dB)
  const avgNeighbor = (alpha + gamma) / 2;
  const prominence = beta - avgNeighbor;
  if (prominence < 1.5) {
    return null; // Flat background noise floor, not a distinct resonance peak
  }

  // Sub-bin parabolic peak interpolation
  const interp = parabolicPeakInterpolation(floatFreqData, peakBin, sampleRate, fftSize);
  const refinedFreq = Math.round(interp.freq * 10) / 10;

  // Clarity heuristic based on peak prominence above local floor
  const clarity = Math.min(1.0, Math.max(0.6, prominence / 12));

  return {
    frequency: refinedFreq,
    magnitude: interp.magnitude,
    clarity,
  };
}

/**
 * Autocorrelation-based pitch detection with bandpass filtering for drum tones
 */
export function detectPitchYIN(
  floatBuffer: Float32Array,
  sampleRate: number,
  minFreq: number = 40,
  maxFreq: number = 600,
  filterCenterHz?: number,
  filterBandwidthPct: number = 0.25
): { frequency: number; clarity: number } | null {
  const bufferSize = floatBuffer.length;

  // Calculate RMS energy to ensure sufficient signal
  let sumSquares = 0;
  for (let i = 0; i < bufferSize; i++) {
    sumSquares += floatBuffer[i] * floatBuffer[i];
  }
  const rms = Math.sqrt(sumSquares / bufferSize);
  if (rms < 0.008) {
    return null; // Signal too quiet
  }

  // Lag bounds
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.min(Math.floor(sampleRate / minFreq), Math.floor(bufferSize / 2));

  // Difference function d_t(lag)
  const halfSize = Math.floor(bufferSize / 2);
  const d = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let diff = 0;
    for (let i = 0; i < halfSize; i++) {
      const delta = floatBuffer[i] - floatBuffer[i + lag];
      diff += delta * delta;
    }
    d[lag] = diff;
  }

  // Cumulative mean normalized difference function (CMNDF)
  const dPrime = new Float32Array(maxLag + 1);
  dPrime[0] = 1;
  let runningSum = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    runningSum += d[lag];
    dPrime[lag] = runningSum === 0 ? 1 : (d[lag] * (lag - minLag + 1)) / runningSum;
  }

  // Find first dip below threshold (0.15 ~ 0.25)
  const threshold = 0.20;
  let bestLag = -1;

  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (dPrime[lag] < threshold) {
      while (lag + 1 < maxLag && dPrime[lag + 1] < dPrime[lag]) {
        lag++;
      }
      bestLag = lag;
      break;
    }
  }

  // If no dip below threshold, find global minimum in range
  if (bestLag === -1) {
    let minVal = 999;
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (dPrime[lag] < minVal) {
        minVal = dPrime[lag];
        bestLag = lag;
      }
    }
    if (minVal > 0.45) {
      return null; // Not confident enough
    }
  }

  // Parabolic interpolation on best lag
  let refinedLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const s0 = dPrime[bestLag - 1];
    const s1 = dPrime[bestLag];
    const s2 = dPrime[bestLag + 1];
    const shift = (s2 - s0) / (2 * (2 * s1 - s2 - s0) + 1e-10);
    refinedLag = bestLag + Math.max(-0.5, Math.min(0.5, shift));
  }

  const detectedHz = sampleRate / refinedLag;
  const clarity = 1 - Math.min(1, dPrime[bestLag]);

  // If filter window is active (Tune-Bot filter mode), check if detected pitch matches
  if (filterCenterHz && filterCenterHz > 0) {
    const lowBound = filterCenterHz * (1 - filterBandwidthPct);
    const highBound = filterCenterHz * (1 + filterBandwidthPct);
    if (detectedHz < lowBound || detectedHz > highBound) {
      // Out of filter band
      return null;
    }
  }

  return {
    frequency: Math.round(detectedHz * 10) / 10,
    clarity,
  };
}

/**
 * Analyzes FFT frequency bins to find prominent peaks:
 * 1. Main peak
 * 2. Subharmonic / fundamental (~0.5x)
 * 3. 5th harmonic (~1.5x)
 * 4. High overtone (~1.6x ~ 2.2x)
 */
export function extractHarmonicPeaks(
  freqData: Float32Array,
  sampleRate: number,
  mainFreq: number
): {
  subharmonicHz?: number;
  fifthHarmonicHz?: number;
  overtoneHz?: number;
} {
  if (mainFreq <= 20) return {};

  const fftSize = freqData.length * 2;
  const binHz = sampleRate / fftSize;

  // Expected target regions
  const expectedSub = mainFreq * 0.5;
  const expected5th = mainFreq * 1.5;
  const expectedOvertone = mainFreq * 1.75;

  let bestSubHz: number | undefined;
  let best5thHz: number | undefined;
  let bestOvertoneHz: number | undefined;

  // Check subharmonic around expectedSub
  if (expectedSub > 35) {
    const centerBin = Math.round(expectedSub / binHz);
    const range = Math.max(2, Math.round(15 / binHz));
    let maxVal = -120;
    let maxBin = centerBin;
    for (let b = Math.max(1, centerBin - range); b <= Math.min(freqData.length - 1, centerBin + range); b++) {
      if (freqData[b] > maxVal) {
        maxVal = freqData[b];
        maxBin = b;
      }
    }
    if (maxVal > -65) {
      const interp = parabolicPeakInterpolation(freqData, maxBin, sampleRate, fftSize);
      bestSubHz = Math.round(interp.freq * 10) / 10;
    }
  }

  // Check 5th harmonic around expected5th
  if (expected5th < sampleRate / 2) {
    const centerBin = Math.round(expected5th / binHz);
    const range = Math.max(3, Math.round(20 / binHz));
    let maxVal = -120;
    let maxBin = centerBin;
    for (let b = Math.max(1, centerBin - range); b <= Math.min(freqData.length - 1, centerBin + range); b++) {
      if (freqData[b] > maxVal) {
        maxVal = freqData[b];
        maxBin = b;
      }
    }
    if (maxVal > -60) {
      const interp = parabolicPeakInterpolation(freqData, maxBin, sampleRate, fftSize);
      best5thHz = Math.round(interp.freq * 10) / 10;
    }
  }

  // Check overtone
  if (expectedOvertone < sampleRate / 2) {
    const centerBin = Math.round(expectedOvertone / binHz);
    const range = Math.max(3, Math.round(25 / binHz));
    let maxVal = -120;
    let maxBin = centerBin;
    for (let b = Math.max(1, centerBin - range); b <= Math.min(freqData.length - 1, centerBin + range); b++) {
      if (freqData[b] > maxVal) {
        maxVal = freqData[b];
        maxBin = b;
      }
    }
    if (maxVal > -60) {
      const interp = parabolicPeakInterpolation(freqData, maxBin, sampleRate, fftSize);
      bestOvertoneHz = Math.round(interp.freq * 10) / 10;
    }
  }

  // Fallbacks if not detected strongly from live noise
  if (!bestSubHz) bestSubHz = Math.round(mainFreq * 0.5 * 10) / 10;
  if (!best5thHz) best5thHz = Math.round(mainFreq * 1.5 * 10) / 10;
  if (!bestOvertoneHz) bestOvertoneHz = Math.round(mainFreq * 1.62 * 10) / 10;

  return {
    subharmonicHz: bestSubHz,
    fifthHarmonicHz: best5thHz,
    overtoneHz: bestOvertoneHz,
  };
}
