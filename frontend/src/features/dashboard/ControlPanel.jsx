import React, { useEffect, useState } from "react";
import { useWebcamStore } from "../../store/useWebcamStore";
import { detectService } from "../../services/detectService";
import { analyticsService } from "../../services/analyticsService";
import { Button } from "../../components/ui/Button";
import { Play, Pause, RefreshCw, Cpu, Activity, Wifi, WifiOff, Timer, Settings2 } from "lucide-react";

// Predefined duration presets (seconds)
const DURATION_PRESETS = [
  { label: "10s", value: 10 },
  { label: "20s", value: 20 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
];

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

  // Duration selector state
  const [selectedDuration, setSelectedDuration] = useState(10); // seconds
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isRecordingCustom, setIsRecordingCustom] = useState(false);
  const [startTime, setStartTime] = useState(null);

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
    const elapsedSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : selectedDuration;

    setIsCountdownRunning(false);
    setDetecting(false);
    setIsRecordingCustom(false);
    setStartTime(null);

    const records = useWebcamStore.getState().capturedRecords;
    if (records.length === 0) {
      clearCapturedRecords();
      return;
    }

    setIsSaving(true);
    try {
      const savedSession = await analyticsService.saveSession({ records });

      const totalRecords = records.length;
      const emotionCounts = {
        happy: 0, sad: 0, angry: 0, neutral: 0, fear: 0, surprise: 0, disgust: 0,
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
        emotionPercentages[k] = parseFloat(((emotionCounts[k] / totalRecords) * 100).toFixed(1));
      });

      let overallDominant = "neutral";
      let maxCount = -1;
      Object.keys(emotionCounts).forEach((k) => {
        if (emotionCounts[k] > maxCount) {
          maxCount = emotionCounts[k];
          overallDominant = k;
        }
      });

      setSessionResult({
        id: savedSession.id,
        dominant_emotion: overallDominant,
        average_confidence: avgConfidence,
        emotion_percentages: emotionPercentages,
        total_frames: totalRecords,
        duration: elapsedSeconds || selectedDuration,
      });
      setShowResultPopup(true);
    } catch (err) {
      console.error("[ControlPanel] Failed to persist batch session:", err);
    } finally {
      setIsSaving(false);
      clearCapturedRecords();
    }
  };

  // Countdown timer clock ticks every second (for timed presets)
  useEffect(() => {
    let timerId = null;
    if (isCountdownRunning && countdown > 0 && !isCustomMode) {
      timerId = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCountdownRunning && countdown === 0 && !isCustomMode) {
      handleStopAndSave();
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isCountdownRunning, countdown, isCustomMode]);

  // Start detection with a preset timed duration
  const handleStartTimed = () => {
    clearCapturedRecords();
    setCountdown(selectedDuration);
    setDetecting(true);
    setIsCountdownRunning(true);
    setStartTime(Date.now());
  };

  // Custom mode: user manually stops
  const handleStartCustom = () => {
    clearCapturedRecords();
    setDetecting(true);
    setIsRecordingCustom(true);
    setIsCountdownRunning(true); // enable recording for custom
    setStartTime(Date.now());
  };

  const handleStopCustom = () => {
    handleStopAndSave();
  };

  const handleToggleDetection = () => {
    if (isDetecting) {
      handleStopAndSave();
    } else if (isCustomMode) {
      handleStartCustom();
    } else {
      handleStartTimed();
    }
  };

  // Format seconds display
  const formatCountdown = (secs) => {
    if (secs >= 60) {
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      return s > 0 ? `${mins}m ${s}s` : `${mins}m`;
    }
    return `${secs}s`;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Duration Selector Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5" /> Session Duration
          </label>
          {!isCustomMode && (
            <span className="text-xs font-bold text-primary">{formatCountdown(selectedDuration)}</span>
          )}
        </div>

        {/* Preset Pills */}
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              disabled={isDetecting}
              onClick={() => {
                setSelectedDuration(preset.value);
                setIsCustomMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                !isCustomMode && selectedDuration === preset.value
                  ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10"
                  : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset.label}
            </button>
          ))}
          {/* Custom Mode Toggle */}
          <button
            disabled={isDetecting}
            onClick={() => setIsCustomMode(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 flex items-center gap-1 ${
              isCustomMode
                ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10"
                : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Settings2 className="h-3 w-3" /> Custom
          </button>
        </div>

        {/* Custom Mode Info */}
        {isCustomMode && (
          <p className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/15 px-3 py-2 rounded-lg">
            Custom mode: Press Start to begin — press Stop whenever you're done.
          </p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        {!isDetecting ? (
          <Button
            variant="primary"
            className="w-full gap-1.5 px-3 text-sm font-medium tracking-tight sm:px-4 md:px-5 sm:text-base"
            onClick={handleToggleDetection}
            disabled={!isModelReady || isSaving}
          >
            <Play className="h-4 w-4" />
            {isCustomMode ? "Start Detection" : `Start Detection (${formatCountdown(selectedDuration)})`}
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="w-full gap-1.5 px-3 text-sm font-medium tracking-tight sm:px-4 md:px-5 sm:text-base"
            onClick={handleStopAndSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving Session...
              </>
            ) : isCustomMode ? (
              <>
                <Pause className="h-4 w-4" /> Stop & Save
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" /> Stop ({countdown}s left)
              </>
            )}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={checkModelStatus}
          isLoading={checkingStatus}
          className="w-full gap-1.5 px-3 text-sm font-medium tracking-tight sm:px-4 md:px-5 sm:text-base"
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
          className="flex h-11 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
        {/* Model Status Indicator */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-950/20 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3" /> AI Model Status
          </span>
          <span className={`text-sm font-semibold mt-1 flex items-center gap-1.5`}>
            <span
              className={`h-2 w-2 rounded-full ${
                isModelReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            {isModelReady ? "Fully Loaded" : "Warming Up..."}
          </span>
        </div>

        {/* Connection Mode Indicator */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-950/20 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            {isWsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} Connection Mode
          </span>
          <span className={`text-sm font-semibold mt-1 flex items-center gap-1.5`}>
            <span
              className={`h-2 w-2 rounded-full ${
                isDetecting
                  ? isWsConnected
                    ? "bg-emerald-500"
                    : "bg-amber-500 animate-pulse"
                  : "bg-zinc-600"
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
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-950/20 border border-zinc-800">
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
