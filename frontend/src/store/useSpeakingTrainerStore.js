import { create } from "zustand";
import { scriptsService } from "../services/scriptsService";

export const useSpeakingTrainerStore = create((set, get) => ({
  presets: [],
  selectedScript: null,
  customScriptText: "",
  prompterFontSize: 24, // default px size
  targetDuration: 30, // seconds
  countdown: 30,
  isCountdownRunning: false,
  coachingSuggestions: [],
  capturedRecords: [],
  sessionResult: null,
  showResultPopup: false,

  // Live telemetry (0-100 values for gauges)
  telemetry: {
    confidence: 50,
    focus: 50,
    energy: 50,
    stability: 50,
  },

  fetchPresets: async () => {
    try {
      const presets = await scriptsService.getPresets();
      set({ presets });
      if (presets.length > 0 && !get().selectedScript) {
        set({ selectedScript: presets[0] });
      }
    } catch (err) {
      console.error("Failed to fetch script presets:", err);
    }
  },

  setSelectedScript: (selectedScript) => set({ selectedScript }),
  setCustomScriptText: (customScriptText) => set({ customScriptText }),
  setPrompterFontSize: (prompterFontSize) => set({ prompterFontSize }),
  setTargetDuration: (targetDuration) => set({ targetDuration, countdown: targetDuration }),
  setCountdown: (countdown) => set({ countdown }),
  setIsCountdownRunning: (isCountdownRunning) => set({ isCountdownRunning }),
  setSessionResult: (sessionResult) => set({ sessionResult }),
  setShowResultPopup: (showResultPopup) => set({ showResultPopup }),

  clearSession: () => set({
    capturedRecords: [],
    coachingSuggestions: [],
    telemetry: {
      confidence: 50,
      focus: 50,
      energy: 50,
      stability: 50,
    },
    sessionResult: null,
  }),

  // Add real-time record and compute telemetry + coaching suggestions
  addCapturedRecord: (record) => {
    const state = get();
    const updatedRecords = [...state.capturedRecords, record];

    // Compute live telemetry based on a sliding window of the last 15 records (~3-5 seconds of feed)
    const windowSize = 15;
    const windowRecords = updatedRecords.slice(-windowSize);

    if (windowRecords.length === 0) {
      set({ capturedRecords: updatedRecords });
      return;
    }

    // 1. Live Focus (presence and centering)
    // Frontal face box check
    const averageBoxX = windowRecords.reduce((sum, r) => sum + r.box_x + r.box_w / 2, 0) / windowRecords.length;
    const averageBoxY = windowRecords.reduce((sum, r) => sum + r.box_y + r.box_h / 2, 0) / windowRecords.length;
    // Bounding coordinates relative to 480x360 canvas center (240, 180)
    const offX = Math.abs(averageBoxX - 240) / 240;
    const offY = Math.abs(averageBoxY - 180) / 180;
    const centeringFactor = Math.max(0, 1 - (offX + offY) / 2);
    // Since record exists, face presence is 100%, we factor centering
    const liveFocus = Math.round(70 + centeringFactor * 30);

    // 2. Live Stability (rate of expression transitions)
    let transitions = 0;
    for (let i = 1; i < windowRecords.length; i++) {
      if (windowRecords[i].dominant_emotion !== windowRecords[i - 1].dominant_emotion) {
        transitions++;
      }
    }
    const volatility = transitions / (windowRecords.length - 1 || 1);
    const liveStability = Math.round(Math.max(10, Math.min(100, 100 - volatility * 180)));

    // 3. Live Energy (bounding box standard deviation / variance)
    const widths = windowRecords.map((r) => r.box_w);
    const meanWidth = widths.reduce((s, w) => s + w, 0) / widths.length;
    const varWidth = widths.reduce((s, w) => s + Math.pow(w - meanWidth, 2), 0) / widths.length;
    const widthDev = Math.sqrt(varWidth);

    const heights = windowRecords.map((r) => r.box_h);
    const meanHeight = heights.reduce((s, h) => s + h, 0) / heights.length;
    const varHeight = heights.reduce((s, h) => s + Math.pow(h - meanHeight, 2), 0) / heights.length;
    const heightDev = Math.sqrt(varHeight);

    const boxVariance = (widthDev + heightDev) / 2;
    const varianceFactor = Math.min(1.0, boxVariance / 10.0); // maxed at 10px dev
    
    // Add expressiveness index from emotion averages
    const avgHappy = windowRecords.reduce((s, r) => s + r.happy, 0) / windowRecords.length;
    const avgSurprise = windowRecords.reduce((s, r) => s + r.surprise, 0) / windowRecords.length;
    const avgNeutral = windowRecords.reduce((s, r) => s + r.neutral, 0) / windowRecords.length;
    const expressiveness = (avgHappy * 0.4) + (avgSurprise * 0.3) + (avgNeutral * 0.1);
    const liveEnergy = Math.round(Math.max(10, Math.min(100, (varianceFactor * 60) + (expressiveness * 0.4) + 20)));

    // 4. Live Confidence
    const avgFear = windowRecords.reduce((s, r) => s + r.fear, 0) / windowRecords.length;
    const avgSad = windowRecords.reduce((s, r) => s + r.sad, 0) / windowRecords.length;
    const avgAngry = windowRecords.reduce((s, r) => s + r.angry, 0) / windowRecords.length;
    const avgDisgust = windowRecords.reduce((s, r) => s + r.disgust, 0) / windowRecords.length;

    const positives = (avgHappy * 1.2) + (avgNeutral * 1.0) + (avgSurprise * 0.4);
    const negatives = (avgFear * 1.5) + (avgSad * 1.0) + (avgAngry * 1.0) + (avgDisgust * 1.2);
    const confidenceBase = 50.0 + (positives - negatives);
    const liveConfidence = Math.round(Math.max(5, Math.min(100, (confidenceBase * 0.6) + (liveStability * 0.2) + (liveFocus * 0.2))));

    // 5. Generate Coaching Feedback
    const suggestions = [];
    if (liveFocus < 65) {
      suggestions.push("Look directly at the camera to maintain eye engagement with your audience.");
    }
    if (liveEnergy < 35) {
      suggestions.push("Animate your expression. Speak with more facial energy and hand gestures.");
    }
    if (liveStability < 45) {
      suggestions.push("Try to keep a steady emotional tone. Avoid quick, jittery expressions.");
    }
    
    // Dominant emotion feedback in the window
    const emotionCounts = {};
    windowRecords.forEach((r) => {
      emotionCounts[r.dominant_emotion] = (emotionCounts[r.dominant_emotion] || 0) + 1;
    });
    const dom = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b, "neutral");

    if (dom === "angry") {
      suggestions.push("Your expression looks slightly tense. Relax your brow and drop your shoulders.");
    } else if (dom === "sad" || dom === "fear") {
      suggestions.push("Take a slow breath. Smile slightly to raise your cheek muscles and project authority.");
    } else if (dom === "happy" && liveConfidence > 75) {
      suggestions.push("Excellent posture and expression! You are projecting strong positivity and poise.");
    }

    // Default recommendation if no warnings
    if (suggestions.length === 0) {
      suggestions.push("Speaking pace is steady. Keep maintaining direct eye contact.");
    }

    // Keep unique tips
    const uniqueSuggestions = Array.from(new Set(suggestions));

    set({
      capturedRecords: updatedRecords,
      telemetry: {
        confidence: liveConfidence,
        focus: liveFocus,
        energy: liveEnergy,
        stability: liveStability,
      },
      coachingSuggestions: uniqueSuggestions,
    });
  },
}));
