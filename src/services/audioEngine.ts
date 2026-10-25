import { detectPitchYIN, extractHarmonicPeaks, frequencyToNote, calculateCentsDifference } from '../utils/audioMath';
import { DetectedPitchInfo } from '../types';

export type PitchCallback = (info: DetectedPitchInfo) => void;
export type SpectrogramCallback = (
  byteFreqData: Uint8Array,
  floatFreqData: Float32Array,
  sampleRate: number
) => void;

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

  // Transient / Drum hit detection
  private prevRms: number = 0;
  private hitHoldCountdown: number = 0;
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

    // Drum hit transient detection
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      sumSquares += this.timeDomainBuffer[i] * this.timeDomainBuffer[i];
    }
    const currentRms = Math.sqrt(sumSquares / this.timeDomainBuffer.length);
    const rmsDelta = currentRms - this.prevRms;
    this.prevRms = currentRms;

    // A drum hit usually creates a sharp sudden onset
    const isOnset = rmsDelta > 0.015 && currentRms > 0.02;

    if (isOnset || this.hitHoldCountdown <= 0) {
      // Analyze pitch
      const pitchResult = detectPitchYIN(
        this.timeDomainBuffer,
        sampleRate,
        45,
        650,
        this.filterEnabled ? this.filterTargetHz : undefined,
        0.25
      );

      if (pitchResult && pitchResult.clarity > 0.65) {
        const noteInfo = frequencyToNote(pitchResult.frequency);
        const harmonics = extractHarmonicPeaks(this.floatFreqBuffer, sampleRate, pitchResult.frequency);

        const pitchInfo: DetectedPitchInfo = {
          frequency: pitchResult.frequency,
          note: noteInfo.fullName,
          cents: noteInfo.cents,
          clarity: pitchResult.clarity,
          timestamp: Date.now(),
          subharmonicHz: harmonics.subharmonicHz,
          fifthHarmonicHz: harmonics.fifthHarmonicHz,
          overtoneHz: harmonics.overtoneHz,
        };

        this.lastPitchInfo = pitchInfo;
        this.hitHoldCountdown = 12; // hold for ~200ms

        if (this.onPitchDetected) {
          this.onPitchDetected(pitchInfo);
        }
      }
    } else {
      this.hitHoldCountdown--;
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}

export const audioEngine = new AudioEngine();
