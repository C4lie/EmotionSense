import React, { useEffect, useState } from "react";
import { useWebcamStore } from "../../store/useWebcamStore";
import { detectService } from "../../services/detectService";
import { analyticsService } from "../../services/analyticsService";
import { Button } from "../../components/ui/Button";
import { Play, Pause, RefreshCw, Cpu, Activity, Wifi, WifiOff } from "lucide-react";

export const ControlPanel = () => {
  const {
    isDetecting,
    isModelReady,
    latency,
    targetFps,
    selectedDeviceId,
    setDetecting,
    setModelReady,
    setTargetFps,
    setSelectedDeviceId,
    countdown,
    isCountdownRunning,
    setCountdown,
    setIsCountdownRunning,
    clearCapturedRecords,
    setSessionResult,
    setShowResultPopup,
    isWsConnected,
  } = useWebcamStore();

  const [devices, setDevices] = useState([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Enumerate video devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const videoDevices = deviceInfos.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, [setSelectedDeviceId, selectedDeviceId]);

  // Check model status
  const checkModelStatus = async () => {
    setCheckingStatus(true);
    try {
      const statusData = await detectService.getModelStatus();
      setModelReady(statusData.model_ready);
    } catch (err) {
      console.error("[ControlPanel] Failed to verify AI engine status:", err);
      setModelReady(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Poll status on mount until ready
  useEffect(() => {
    checkModelStatus();

    const interval = setInterval(() => {
      if (!useWebcamStore.getState().isModelReady) {
        checkModelStatus();
      } else {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [setModelReady]);

  // Stop detection and persist captured records as a single session
  const handleStopAndSave = async () => {
    setIsCountdownRunning(false);
    setDetecting(false);

    const records = useWebcamStore.getState().capturedRecords;
    if (records.length === 0) {
      clearCapturedRecords();
      return;
    }

    setIsSaving(true);
    try {
      // Batch save records to backend database as a single session
      const savedSession = await analyticsService.saveSession({ records });

      // Aggregate statistics for the modal presentation
      const totalRecords = records.length;
      const emotionCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        neutral: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
      };

      let sumConfidence = 0;
      records.forEach((r) => {
        sumConfidence += r.confidence;
        if (emotionCounts[r.dominant_emotion] !== undefined) {
          emotionCounts[r.dominant_emotion]++;
        }
      });

      const avgConfidence = sumConfidence / totalRecords;

      const emotionPercentages = {};
      Object.keys(emotionCounts).forEach((k) => {
        emotionPercentages[k] = parseFloat(
          ((emotionCounts[k] / totalRecords) * 100).toFixed(1)
        );
      });

      // Find overall dominant emotion
      let overallDominant = "neutral";
      let maxCount = -1;
      Object.keys(emotionCounts).forEach((k) => {
        if (emotionCounts[k] > maxCount) {
          maxCount = emotionCounts[k];
          overallDominant = k;
        }
      });

      // Set store result and trigger popup modal
      setSessionResult({
        id: savedSession.id,
        dominant_emotion: overallDominant,
        average_confidence: avgConfidence,
        emotion_percentages: emotionPercentages,
        total_frames: totalRecords,
      });
      setShowResultPopup(true);
    } catch (err) {
      console.error("[ControlPanel] Failed to persist batch session:", err);
    } finally {
      setIsSaving(false);
      clearCapturedRecords();
    }
  };

  // Countdown timer clock ticks every second
  useEffect(() => {
    let timerId = null;
    if (isCountdownRunning && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCountdownRunning && countdown === 0) {
      handleStopAndSave();
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isCountdownRunning, countdown]);

  const handleToggleDetection = () => {
    if (isDetecting) {
      handleStopAndSave();
    } else {
      clearCapturedRecords();
      setCountdown(10);
      setDetecting(true);
      setIsCountdownRunning(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={isDetecting ? "destructive" : "primary"}
          className="flex-1 gap-2 font-medium"
          onClick={handleToggleDetection}
          disabled={!isModelReady || isSaving}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Saving Session...
            </>
          ) : isDetecting ? (
            <>
              <Pause className="h-4 w-4" /> Stop Detection ({countdown}s)
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Start Detection (10s)
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={checkModelStatus}
          isLoading={checkingStatus}
          className="gap-2"
          disabled={isDetecting}
        >
          <RefreshCw className="h-4 w-4" /> Refresh Engine
        </Button>
      </div>

      {/* Camera Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Select Camera Device</label>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="flex h-11 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
        >
          {devices.map((device, idx) => (
            <option key={device.deviceId} value={device.deviceId} className="bg-zinc-900">
              {device.label || `Camera ${idx + 1}`}
            </option>
          ))}
          {devices.length === 0 && (
            <option className="bg-zinc-900" disabled>No video inputs found</option>
          )}
        </select>
      </div>

      {/* Target FPS Speed Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Frame Sampling Rate</label>
          <span className="text-xs font-semibold text-primary">{targetFps} Hz (FPS)</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={targetFps}
          onChange={(e) => setTargetFps(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p className="text-[11px] text-muted-foreground">
          Increasing FPS provides smoother box overlays but increases network usage.
        </p>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
        {/* Model Status Indicator */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/30 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3" /> AI Model Status
          </span>
          <span className={`text-sm font-semibold mt-1 flex items-center gap-1.5`}>
            <span
              className={`h-2 w-2 rounded-full ${
                isModelReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse"
              }`}
            />
            {isModelReady ? "Fully Loaded" : "Warming Up..."}
          </span>
        </div>

        {/* Connection Mode Indicator */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/30 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            {isWsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} Connection Mode
          </span>
          <span className={`text-sm font-semibold mt-1 flex items-center gap-1.5`}>
            <span
              className={`h-2 w-2 rounded-full ${
                isDetecting
                  ? isWsConnected
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-amber-500 animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            {isDetecting
              ? isWsConnected
                ? "WebSocket"
                : "HTTP Polling"
              : "Idle"}
          </span>
        </div>

        {/* Network Response Performance Latency */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/30 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" /> Inference Speed
          </span>
          <span className="text-sm font-semibold mt-1 text-white">
            {isDetecting && latency > 0 ? `${latency} ms` : "Idle"}
          </span>
        </div>
      </div>
    </div>
  );
};
