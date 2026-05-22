/**
 * useToneEngine.js
 * Custom React hook for real-time audio tone analysis.
 *
 * Uses the browser Web Audio API (AnalyserNode) to compute:
 *   - Vocal energy  (RMS amplitude, normalised 0–100)
 *   - Speech pace   (zero-crossing rate as a consonant/rhythm proxy)
 *   - Hesitation    (silence detection via RMS threshold)
 *   - Expressiveness(peak-to-mean energy ratio across windows)
 *   - Consistency   (energy standard deviation across 2-second windows)
 *
 * NO audio data is ever sent to the server.
 * Only the final numeric metric summary is submitted to the API.
 *
 * Usage:
 *   const { startCapture, stopCapture, isCapturing, liveEnergy, livePace, liveHesitation } = useToneEngine();
 *   const ok = await startCapture();
 *   // ... user speaks ...
 *   const metrics = stopCapture();  // returns audio_metrics object
 *   store.submitForAnalysis(metrics, emotionRecords);
 */
import { useRef, useState, useCallback } from "react";

const SILENCE_THRESHOLD = 0.02;   // RMS below this = silence
const WINDOW_DURATION_MS = 2000;  // Aggregate into 2-second windows
const SAMPLE_INTERVAL_MS = 100;   // Sample every 100ms

export const useToneEngine = () => {
  // Refs — not reactive, mutated by timers without causing re-renders
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sampleTimerRef = useRef(null);
  const windowTimerRef = useRef(null);
  const dataBufferRef = useRef([]);   // Energy samples in current window
  const allWindowsRef = useRef([]);   // Aggregate window summaries
  const zeroCrossingsRef = useRef(0);
  const totalSamplesRef = useRef(0);
  const silentSamplesRef = useRef(0);

  // Reactive state — drive live UI gauges
  const [isCapturing, setIsCapturing] = useState(false);
  const [liveEnergy, setLiveEnergy] = useState(0);
  const [livePace, setLivePace] = useState(0);
  const [liveHesitation, setLiveHesitation] = useState(0);

  /** Compute RMS energy from a Float32Array of PCM samples. */
  const computeRMS = (buffer) => {
    const sum = buffer.reduce((acc, v) => acc + v * v, 0);
    return Math.sqrt(sum / buffer.length);
  };

  /**
   * Start microphone capture and begin analysis.
   * @returns {Promise<boolean>} true if mic access granted, false otherwise
   */
  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Reset all accumulators
      dataBufferRef.current = [];
      allWindowsRef.current = [];
      zeroCrossingsRef.current = 0;
      totalSamplesRef.current = 0;
      silentSamplesRef.current = 0;

      const pcmBuffer = new Float32Array(analyser.fftSize);

      // ── Sample loop (runs every 100ms) ────────────────────────────────────
      sampleTimerRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(pcmBuffer);
        const rms = computeRMS(pcmBuffer);
        const normalizedEnergy = Math.min(100, rms * 500); // 0–100 scale

        dataBufferRef.current.push(normalizedEnergy);
        totalSamplesRef.current++;

        if (rms < SILENCE_THRESHOLD) {
          silentSamplesRef.current++;
        }

        // Count zero crossings for pace estimation
        for (let i = 1; i < pcmBuffer.length; i++) {
          if (pcmBuffer[i] >= 0 !== pcmBuffer[i - 1] >= 0) {
            zeroCrossingsRef.current++;
          }
        }

        // Update live energy gauge
        setLiveEnergy(Math.round(normalizedEnergy));

        // Update live hesitation gauge
        const hesitation =
          totalSamplesRef.current > 0
            ? silentSamplesRef.current / totalSamplesRef.current
            : 0;
        setLiveHesitation(Math.round(hesitation * 100));
      }, SAMPLE_INTERVAL_MS);

      // ── Window aggregation (runs every 2 seconds) ─────────────────────────
      windowTimerRef.current = setInterval(() => {
        const windowData = [...dataBufferRef.current];
        if (windowData.length === 0) return;

        const windowEnergy =
          windowData.reduce((a, b) => a + b, 0) / windowData.length;
        const windowPeak = Math.max(...windowData);

        allWindowsRef.current.push({
          energy: windowEnergy,
          peak: windowPeak,
          samples: windowData.length,
        });

        // Live pace from zero-crossing rate
        const zcRate =
          zeroCrossingsRef.current /
          Math.max(1, totalSamplesRef.current * (analyser.fftSize / 100));
        const paceScore = Math.min(100, zcRate * 200);
        setLivePace(Math.round(paceScore));

        dataBufferRef.current = []; // Reset window buffer
      }, WINDOW_DURATION_MS);

      setIsCapturing(true);
      return true;
    } catch (err) {
      console.error("[useToneEngine] Microphone access failed:", err);
      return false;
    }
  }, []);

  /**
   * Stop audio capture and compute final aggregate metrics.
   * @returns {Object} audio_metrics payload ready to send to the backend
   */
  const stopCapture = useCallback(() => {
    // Stop timers
    if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
    if (windowTimerRef.current) clearInterval(windowTimerRef.current);

    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    setIsCapturing(false);

    // ── Compute final metrics ─────────────────────────────────────────────
    const windows = allWindowsRef.current;
    const total = totalSamplesRef.current;
    const silent = silentSamplesRef.current;

    // Return sensible defaults if no audio was captured
    if (windows.length === 0 || total === 0) {
      return {
        energy_mean: 50,
        energy_std: 10,
        pace_score: 50,
        hesitation_rate: 0.2,
        expressiveness: 50,
        silence_ratio: 0.2,
        window_count: 0,
      };
    }

    const energies = windows.map((w) => w.energy);
    const energy_mean = energies.reduce((a, b) => a + b, 0) / energies.length;

    // Standard deviation of per-window energy
    const variance =
      energies.reduce((acc, e) => acc + (e - energy_mean) ** 2, 0) /
      energies.length;
    const energy_std = Math.sqrt(variance);

    // Pace from zero-crossing rate (normalised)
    const zcRate =
      zeroCrossingsRef.current / Math.max(1, total * 20);
    const pace_score = Math.min(100, zcRate * 150);

    // Hesitation and silence
    const hesitation_rate = Math.min(1, silent / Math.max(1, total));
    const silence_ratio = hesitation_rate;

    // Expressiveness: peak-to-mean ratio across windows
    const peaks = windows.map((w) => w.peak);
    const avgPeak = peaks.reduce((a, b) => a + b, 0) / peaks.length;
    const expressiveness = Math.min(
      100,
      (avgPeak / Math.max(1, energy_mean)) * 50
    );

    return {
      energy_mean: Math.round(energy_mean * 10) / 10,
      energy_std: Math.round(energy_std * 10) / 10,
      pace_score: Math.round(pace_score * 10) / 10,
      hesitation_rate: Math.round(hesitation_rate * 1000) / 1000,
      expressiveness: Math.round(expressiveness * 10) / 10,
      silence_ratio: Math.round(silence_ratio * 1000) / 1000,
      window_count: windows.length,
    };
  }, []);

  return {
    /** Whether microphone capture is currently active. */
    isCapturing,
    /** Live energy level (0–100) for UI gauge display. */
    liveEnergy,
    /** Live pace score (0–100) estimated from zero-crossing rate. */
    livePace,
    /** Live hesitation percentage (0–100) based on silence ratio. */
    liveHesitation,
    /**
     * Start microphone capture. Returns true if permission granted.
     * @returns {Promise<boolean>}
     */
    startCapture,
    /**
     * Stop capture and return the final computed audio_metrics object.
     * @returns {Object}
     */
    stopCapture,
  };
};
