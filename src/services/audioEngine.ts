import { detectPeakFrequencyFromFFT, extractHarmonicPeaks, frequencyToNote } from '../utils/audioMath';
import { DetectedPitchInfo } from '../types';

export type PitchCallback = (info: DetectedPitchInfo) => void;
export type SpectrogramCallback = (
  byteFreqData: Uint8Array,
  floatFreqData: Float32Array,
  sampleRate: number
) => void;

interface PeakSample {
  freq: number;
  magnitude: number;
  timestamp: number;
}

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;

  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  // Audio buffers
  private timeDomainBuffer: Float32Array = new Float32Array(8192);
  private floatFreqBuffer: Float32Array = new Float32Array(4096);
  private byteFreqBuffer: Uint8Array = new Uint8Array(4096);

  // Callbacks
  private onPitchDetected: PitchCallback | null = null;
  private onSpectrogramFrame: SpectrogramCallback | null = null;

  // Filter mode settings (Tune-Bot filter feature)
  private filterEnabled: boolean = false;
  private filterTargetHz: number = 0;

  // Absolute time-based sliding window peak smoothing (seconds)
  private smoothingDurationSec: number = 1.0; // default: 1.0초 (1000ms) - 메인 화면 피크 1초에 1번 갱신
  private peakWindow: PeakSample[] = [];
  private lastEmittedTime: number = 0;
  private lastEmittedFreq: number = 0;
  private lastPitchInfo: DetectedPitchInfo | null = null;

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Request raw mic audio without system echo cancellation / noise suppression
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 8192;
      this.analyser.smoothingTimeConstant = 0.25;

      this.timeDomainBuffer = new Float32Array(this.analyser.fftSize);
      this.floatFreqBuffer = new Float32Array(this.analyser.frequencyBinCount);
      this.byteFreqBuffer = new Uint8Array(this.analyser.frequencyBinCount);

      this.sourceNode.connect(this.analyser);

      this.isRunning = true;
      this.lastEmittedTime = performance.now();
      this.peakWindow = [];
      this.loop();
      return true;
    } catch (err) {
      console.error('Failed to start audio engine:', err);
      return false;
    }
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    this.isRunning = false;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public setCallbacks(pitchCb: PitchCallback | null, specCb: SpectrogramCallback | null): void {
    this.onPitchDetected = pitchCb;
    this.onSpectrogramFrame = specCb;
  }

  public setFilter(enabled: boolean, targetHz: number = 0): void {
    this.filterEnabled = enabled;
    this.filterTargetHz = targetHz;
  }

  public setSmoothingDurationSec(sec: number): void {
    this.smoothingDurationSec = Math.max(0, Math.min(3.0, sec));
  }

  public getSmoothingDurationSec(): number {
    return this.smoothingDurationSec;
  }

  // Backward compatible alias
  public setSmoothingWindow(value: number): void {
    const duration = value > 2 ? 1.0 : value;
    this.setSmoothingDurationSec(duration);
  }

  public getSampleRate(): number {
    return this.audioCtx?.sampleRate || 44100;
  }

  public getFFTSize(): number {
    return this.analyser?.fftSize || 4096;
  }

  public getLatestFrequencyData(outputBuffer?: Uint8Array): { data: Uint8Array; sampleRate: number; fftSize: number } {
    if (this.analyser && this.isRunning) {
      if (outputBuffer) {
        (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(outputBuffer);
      }
    }
    return {
      data: outputBuffer || this.byteFreqBuffer,
      sampleRate: this.audioCtx?.sampleRate || 44100,
      fftSize: this.analyser?.fftSize || 4096,
    };
  }

  private loop = (): void => {
    if (!this.isRunning || !this.analyser || !this.audioCtx) return;

    (this.analyser as unknown as { getFloatTimeDomainData: (arr: Float32Array) => void }).getFloatTimeDomainData(this.timeDomainBuffer);
    (this.analyser as unknown as { getFloatFrequencyData: (arr: Float32Array) => void }).getFloatFrequencyData(this.floatFreqBuffer);
    (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(this.byteFreqBuffer);

    const sampleRate = this.audioCtx.sampleRate;

    // Send spectrogram frame
    if (this.onSpectrogramFrame) {
      this.onSpectrogramFrame(this.byteFreqBuffer, this.floatFreqBuffer, sampleRate);
    }

    // Direct FFT Peak Detection (matches spectrometer highest intensity peak exactly)
    const peakResult = detectPeakFrequencyFromFFT(
      this.floatFreqBuffer,
      sampleRate,
      this.analyser.fftSize,
      {
        minHz: 30,
        maxHz: 650,
        filterEnabled: this.filterEnabled,
        filterCenterHz: this.filterTargetHz,
        filterBandwidthPct: 0.25,
        minDbThreshold: -70,
      }
    );

    const now = performance.now();
    const intervalMs = this.smoothingDurationSec * 1000;

    if (intervalMs <= 20) {
      // Zero-delay mode (무지연 즉각 반응)
      if (peakResult) {
        const smoothedFreq = Math.round(peakResult.frequency * 10) / 10;
        this.lastEmittedFreq = smoothedFreq;

        const noteInfo = frequencyToNote(smoothedFreq);
        const harmonics = extractHarmonicPeaks(this.floatFreqBuffer, sampleRate, smoothedFreq);

        const pitchInfo: DetectedPitchInfo = {
          frequency: smoothedFreq,
          note: noteInfo.fullName,
          cents: noteInfo.cents,
          clarity: 1.0,
          timestamp: Date.now(),
          subharmonicHz: harmonics.subharmonicHz,
          fifthHarmonicHz: harmonics.fifthHarmonicHz,
          overtoneHz: harmonics.overtoneHz,
        };

        this.lastPitchInfo = pitchInfo;

        if (this.onPitchDetected) {
          this.onPitchDetected(pitchInfo);
        }
      }
    } else {
      if (peakResult) {
        this.peakWindow.push({
          freq: peakResult.frequency,
          magnitude: peakResult.magnitude,
          timestamp: now,
        });
      }

      // Maintain time-based sliding window of samples within intervalMs
      while (this.peakWindow.length > 0 && now - this.peakWindow[0].timestamp > intervalMs) {
        this.peakWindow.shift();
      }

      // Check if interval has elapsed since last update (strictly 1 update per interval, e.g. 1초에 한 번)
      const timeSinceLastEmit = now - this.lastEmittedTime;

      if (timeSinceLastEmit >= intervalMs) {
        this.lastEmittedTime = now;

        if (this.peakWindow.length > 0) {
          // Find loudest peak sample in this sliding window (dominant drum strike)
          let maxMagSample = this.peakWindow[0];
          for (let i = 1; i < this.peakWindow.length; i++) {
            if (this.peakWindow[i].magnitude > maxMagSample.magnitude) {
              maxMagSample = this.peakWindow[i];
            }
          }

          // Calculate power-weighted average focused on the loudest strike peak in the window
          let totalWeight = 0;
          let weightedSum = 0;
          for (let i = 0; i < this.peakWindow.length; i++) {
            const s = this.peakWindow[i];
            const dbDiff = s.magnitude - maxMagSample.magnitude;
            if (dbDiff >= -12) {
              const weight = Math.pow(10, dbDiff / 10);
              weightedSum += s.freq * weight;
              totalWeight += weight;
            }
          }

          const smoothedFreq = totalWeight > 0
            ? Math.round((weightedSum / totalWeight) * 10) / 10
            : Math.round(maxMagSample.freq * 10) / 10;

          this.lastEmittedFreq = smoothedFreq;

          const noteInfo = frequencyToNote(smoothedFreq);
          const harmonics = extractHarmonicPeaks(this.floatFreqBuffer, sampleRate, smoothedFreq);

          const pitchInfo: DetectedPitchInfo = {
            frequency: smoothedFreq,
            note: noteInfo.fullName,
            cents: noteInfo.cents,
            clarity: 1.0,
            timestamp: Date.now(),
            subharmonicHz: harmonics.subharmonicHz,
            fifthHarmonicHz: harmonics.fifthHarmonicHz,
            overtoneHz: harmonics.overtoneHz,
          };

          this.lastPitchInfo = pitchInfo;

          if (this.onPitchDetected) {
            this.onPitchDetected(pitchInfo);
          }
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}

export const audioEngine = new AudioEngine();
