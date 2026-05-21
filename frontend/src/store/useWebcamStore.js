import { create } from "zustand";

export const useWebcamStore = create((set) => ({
  isDetecting: false,
  faces: [],
  fps: 0,
  latency: 0,
  isModelReady: false,
  selectedDeviceId: "",
  targetFps: 2, // Default to 2 FPS for HTTP polling fallback, can increase for WebSockets
  compressionQuality: 0.7,
  resolution: { width: 640, height: 480 },
  isWsConnected: false,

  // Countdown & Session persistence states
  countdown: 10,
  isCountdownRunning: false,
  capturedRecords: [],
  sessionResult: null,
  showResultPopup: false,

  setDetecting: (isDetecting) => set((state) => {
    // If stopping detection, clear countdown states unless showing result popup
    const update = { isDetecting };
    if (!isDetecting) {
      update.isCountdownRunning = false;
    }
    return update;
  }),
  setFaces: (faces) => set({ faces }),
  setFps: (fps) => set({ fps }),
  setLatency: (latency) => set({ latency }),
  setModelReady: (isModelReady) => set({ isModelReady }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
  setTargetFps: (targetFps) => set({ targetFps }),
  setCompressionQuality: (compressionQuality) => set({ compressionQuality }),
  setResolution: (width, height) => set({ resolution: { width, height } }),
  setWsConnected: (isWsConnected) => set({ isWsConnected }),

  // Countdown & Batch setters
  setCountdown: (countdown) => set({ countdown }),
  setIsCountdownRunning: (isCountdownRunning) => set({ isCountdownRunning }),
  addCapturedRecord: (record) => set((state) => ({ 
    capturedRecords: [...state.capturedRecords, record] 
  })),
  clearCapturedRecords: () => set({ capturedRecords: [] }),
  setSessionResult: (sessionResult) => set({ sessionResult }),
  setShowResultPopup: (showResultPopup) => set({ showResultPopup }),
}));
