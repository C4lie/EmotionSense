import React, { useEffect, useState, useRef } from "react";
import { useSpeakingTrainerStore } from "../../store/useSpeakingTrainerStore";
import { useWebcamStore } from "../../store/useWebcamStore";
import { WebcamFeed } from "./WebcamFeed";
import { TrainerSessionReport } from "./TrainerSessionReport";
import { analyticsService } from "../../services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { 
  BookOpen, 
  Settings, 
  Play, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  Clock, 
  Cpu, 
  Activity, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Eye, 
  Heart,
  ChevronRight,
  Wifi,
  Loader2
} from "lucide-react";
import { cn } from "../../utils/cn";

export const SpeakingTrainerDashboard = () => {
  const {
    presets,
    selectedScript,
    customScriptText,
    prompterFontSize,
    targetDuration,
    countdown,
    isCountdownRunning,
    coachingSuggestions,
    capturedRecords,
    sessionResult,
    showResultPopup,
    telemetry,
    fetchPresets,
    setSelectedScript,
    setCustomScriptText,
    setPrompterFontSize,
    setTargetDuration,
    setCountdown,
    setIsCountdownRunning,
    setSessionResult,
    setShowResultPopup,
    clearSession,
    addCapturedRecord,
  } = useSpeakingTrainerStore();

  const {
    isDetecting,
    isModelReady,
    setDetecting,
    isWsConnected,
  } = useWebcamStore();

  // Local pre-countdown states
  const [preCountdown, setPreCountdown] = useState(0);
  const [isPreCountdownActive, setIsPreCountdownActive] = useState(false);
  const [customTextOpen, setCustomTextOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const prompterRef = useRef(null);

  // Load presets on mount
  useEffect(() => {
    fetchPresets();
    
    // Connect webcam record listener to the speaking trainer store
    useWebcamStore.setState({ onRecordCaptured: addCapturedRecord });

    return () => {
      // Disconnect callback
      useWebcamStore.setState({ onRecordCaptured: null });
      // Stop detection if running
      const { isDetecting, setDetecting } = useWebcamStore.getState();
      if (isDetecting) {
        setDetecting(false);
        useWebcamStore.setState({ isCountdownRunning: false });
      }
      clearSession();
    };
  }, [fetchPresets, addCapturedRecord, clearSession]);

  // Teleprompter Auto Scrolling Effect
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const scrollPrompter = (time) => {
      if (prompterRef.current && isCountdownRunning && countdown > 0) {
        const elapsed = (time - lastTime) / 1000;
        const scrollHeight = prompterRef.current.scrollHeight;
        const clientHeight = prompterRef.current.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        
        if (maxScroll > 0) {
          // speed: pixels per second to scroll entire script by the end of session
          const speed = maxScroll / targetDuration; 
          prompterRef.current.scrollTop += speed * elapsed;
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(scrollPrompter);
    };

    if (isCountdownRunning) {
      animationFrameId = requestAnimationFrame(scrollPrompter);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCountdownRunning, targetDuration, countdown]);

  // 3s Pre-Countdown logic
  useEffect(() => {
    let preTimer;
    if (isPreCountdownActive && preCountdown > 0) {
      preTimer = setTimeout(() => {
        setPreCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isPreCountdownActive && preCountdown === 0) {
      setIsPreCountdownActive(false);
      // Start the actual session
      startActiveSession();
    }
    return () => clearTimeout(preTimer);
  }, [isPreCountdownActive, preCountdown]);

  // Practice countdown timer tick
  useEffect(() => {
    let intervalId;
    if (isCountdownRunning && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCountdownRunning && countdown === 0) {
      handleStopPractice();
    }
    return () => clearInterval(intervalId);
  }, [isCountdownRunning, countdown]);

  const activeScriptText = selectedScript?.id === "custom" 
    ? customScriptText 
    : (selectedScript?.text || "");

  // Action: Start Countdown Trigger
  const handleStartPractice = () => {
    if (!isModelReady) return;
    
    // Reset state
    clearSession();
    if (prompterRef.current) {
      prompterRef.current.scrollTop = 0;
    }

    // Set 3-second ready countdown
    setPreCountdown(3);
    setIsPreCountdownActive(true);
  };

  // Helper: Start actual session after pre-countdown
  const startActiveSession = () => {
    // Start Webcam Inference
    setDetecting(true);
    // Start session record capture flag
    useWebcamStore.setState({ isCountdownRunning: true });
    
    // Set prompter timer states
    setCountdown(targetDuration);
    setIsCountdownRunning(true);
  };

  // Action: Stop practice session and save data
  const handleStopPractice = async () => {
    setIsCountdownRunning(false);
    setDetecting(false);
    useWebcamStore.setState({ isCountdownRunning: false });

    const records = useSpeakingTrainerStore.getState().capturedRecords;

    if (records.length === 0) {
      alert("No expression telemetry was recorded. Make sure your camera is active and detects a face.");
      clearSession();
      return;
    }

    setIsSaving(true);
    try {
      // Save speaking session via API
      const result = await analyticsService.saveSession({
        records: records,
        session_type: "speaking",
        script_text: activeScriptText
      });

      // Populate aggregated result fields for reporting
      setSessionResult({
        id: result.id,
        confidence_score: result.confidence_score,
        stability_score: result.stability_score,
        eye_contact_score: result.eye_contact_score,
        speaking_energy: result.speaking_energy,
        script_text: result.script_text
      });

      setShowResultPopup(true);
    } catch (err) {
      console.error("Failed to save speaking session:", err);
      alert("An error occurred while saving the practice session details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format stopwatch readout (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Preset font options scaling helper
  const handleFontSizeChange = (increase) => {
    setPrompterFontSize(Math.max(16, Math.min(48, prompterFontSize + (increase ? 4 : -4))));
  };

  const getConfidenceColor = (score) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-primary";
    return "text-accent-danger";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative min-h-screen">
      {/* Glow overlays */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Page Title Header */}
      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" /> Confidence Suite V3.0
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 font-display">
            <BookOpen className="h-8 w-8 text-primary" /> Confidence Builder Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Improve your speaking dynamics, pacing, volume, and camera focus using real-time feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDetecting && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-glow-sm animate-pulse">
              <Activity className="h-3.5 w-3.5" /> Recording Live
            </span>
          )}
          {isWsConnected && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary shadow-glow-sm">
              <Wifi className="h-3.5 w-3.5" /> Low Latency Stream
            </span>
          )}
        </div>
      </div>

      {/* Main Splitscreen Layout */}
      <div className="grid lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side Column: Config & Webcam Feed (4/12 width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controls Deck card */}
          <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                <Settings className="h-4.5 w-4.5 text-muted-foreground" /> Configuration
              </CardTitle>
              <CardDescription>Setup script text and session timer limit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Select Script Preset */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block font-display">Speech Prompt / Script</label>
                <select
                  disabled={isCountdownRunning}
                  value={selectedScript?.id || ""}
                  onChange={(e) => {
                    const preset = presets.find((p) => p.id === e.target.value);
                    if (preset) {
                      setSelectedScript(preset);
                      setCustomTextOpen(false);
                    } else if (e.target.value === "custom") {
                      setSelectedScript({ id: "custom", title: "Custom Script Text", text: customScriptText });
                      setCustomTextOpen(true);
                    }
                  }}
                  className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all"
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-surface">
                      {preset.category} - {preset.title}
                    </option>
                  ))}
                  <option value="custom" className="bg-surface">+ Custom Text Prompt</option>
                </select>
              </div>

              {/* Custom script text area if toggled */}
              {(selectedScript?.id === "custom" || customTextOpen) && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-250">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block font-display">Custom Prompt Input</label>
                  <textarea
                    disabled={isCountdownRunning}
                    value={customScriptText}
                    onChange={(e) => setCustomScriptText(e.target.value)}
                    placeholder="Enter the speech script you want to practice reading here..."
                    className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              )}

              {/* Duration selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display">Session Limit Duration</label>
                  <span className="text-xs font-bold text-primary">{targetDuration} seconds</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      disabled={isCountdownRunning}
                      onClick={() => setTargetDuration(sec)}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg border transition-all duration-250",
                        targetDuration === sec
                          ? "bg-primary/10 border-primary text-primary shadow-glow-sm"
                          : "border-border bg-background hover:bg-surface text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    disabled={isCountdownRunning}
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="pt-4 border-t border-border/30 flex flex-col gap-3">
                {!isCountdownRunning ? (
                  <Button
                    variant="primary"
                    className="w-full gap-2 font-bold shadow-glow-sm"
                    onClick={handleStartPractice}
                    disabled={!isModelReady || isPreCountdownActive || isSaving}
                  >
                    <Play className="h-4.5 w-4.5" /> Start Practice Run
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full gap-2 font-bold"
                    onClick={handleStopPractice}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" /> Finalizing Summary...
                      </>
                    ) : (
                      <>
                        <Square className="h-4.5 w-4.5" /> Stop & Compile Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Webcam Feed Viewer Container */}
          <div className="relative group rounded-xl overflow-hidden border border-border bg-background p-1 shadow-elevated">
            <WebcamFeed 
              sessionType="speaking" 
              scriptText={activeScriptText} 
            />
          </div>
        </div>

        {/* Center & Right Column: Teleprompter & Live Telemetry Gauges (8/12 width) */}
        <div className="lg:col-span-8 grid md:grid-cols-12 gap-6">
          
          {/* Teleprompter Panel (7/12 width) */}
          <Card className="md:col-span-7 flex flex-col h-[580px] border-border/50 bg-surface/30 backdrop-blur-xl shadow-elevated relative">
            <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                  <FileText className="h-4.5 w-4.5 text-primary" /> Speech Teleprompter
                </CardTitle>
                <CardDescription>Follow along and present clearly.</CardDescription>
              </div>

              {/* Adjust font size */}
              <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
                <button
                  onClick={() => handleFontSizeChange(false)}
                  className="p-1.5 hover:bg-surface rounded-md text-muted-foreground hover:text-foreground transition"
                  title="Decrease Font Size"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-bold text-muted-foreground px-1.5">{prompterFontSize}px</span>
                <button
                  onClick={() => handleFontSizeChange(true)}
                  className="p-1.5 hover:bg-surface rounded-md text-muted-foreground hover:text-foreground transition"
                  title="Increase Font Size"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            
            {/* Scrollable text screen */}
            <div 
              ref={prompterRef}
              className="flex-grow overflow-y-auto p-6 scroll-smooth select-none relative"
              style={{ fontSize: `${prompterFontSize}px`, lineHeight: "1.6" }}
            >
              {isCountdownRunning && (
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-background/20 to-transparent pointer-events-none" />
              )}
              
              <div className="text-foreground/90 font-medium whitespace-pre-wrap pb-64 pt-4">
                {activeScriptText || (
                  <p className="text-sm italic text-muted-foreground/60 text-center pt-24 font-normal">
                    Select a script preset from the configuration panel to begin.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Timer Status panel */}
            <div className="p-4 border-t border-border/30 bg-background/60 rounded-b-xl flex items-center justify-between text-muted-foreground text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-muted-foreground font-display">Remaining time</span>
              </div>
              <span className="text-xl font-black text-foreground font-mono tracking-wider">
                {formatTime(countdown)}
              </span>
            </div>
          </Card>

          {/* Right Column: Telemetry Gauge Panel (5/12 width) */}
          <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
            
            {/* Live Metrics Card */}
            <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated flex-grow">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                  <Activity className="h-4.5 w-4.5 text-accent-success" /> Live Metrics Telemetry
                </CardTitle>
                <CardDescription>Updated dynamically based on facial micro-expressions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Confidence Meter */}
                <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" /> Confidence Index
                    </span>
                    <span className={`text-base font-black ${getConfidenceColor(telemetry.confidence)}`}>
                      {telemetry.confidence}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                      style={{ width: `${telemetry.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Focus Indicator */}
                <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                      <Eye className="h-3.5 w-3.5 text-accent" /> Camera Focus
                    </span>
                    <span className="text-base font-black text-accent">
                      {telemetry.focus}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${telemetry.focus}%` }}
                    />
                  </div>
                </div>

                {/* Emotional Stability */}
                <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                      <Cpu className="h-3.5 w-3.5 text-accent-success" /> Emotional Stability
                    </span>
                    <span className="text-base font-black text-accent-success">
                      {telemetry.stability}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-accent-success rounded-full transition-all duration-300"
                      style={{ width: `${telemetry.stability}%` }}
                    />
                  </div>
                </div>

                {/* Energy Indicator */}
                <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                      <Heart className="h-3.5 w-3.5 text-accent-danger" /> Speaking Energy
                    </span>
                    <span className="text-base font-black text-accent-danger">
                      {telemetry.energy}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-accent-danger rounded-full transition-all duration-300"
                      style={{ width: `${telemetry.energy}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coaching Tips Module */}
            <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated min-h-[160px]">
              <CardHeader className="pb-2 border-b border-border/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-display">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Live Speech Coaching
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[160px] overflow-y-auto">
                <div className="space-y-3">
                  {coachingSuggestions.length > 0 ? (
                    coachingSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-xs text-foreground/80 leading-relaxed animate-in fade-in duration-250">
                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic text-center pt-8">
                      Start recording to receive real-time coaching suggestions...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>

      {/* 3s Count-down screen overlay */}
      {isPreCountdownActive && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 animate-in fade-in duration-250">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary block mb-4 animate-pulse">Get ready to speak...</span>
            <div className="text-8xl font-black text-foreground animate-bounce">
              {preCountdown}
            </div>
            <p className="text-muted-foreground text-xs mt-6">Position yourself clearly in front of the camera.</p>
          </div>
        </div>
      )}

      {/* Concluding Session Report popup modal */}
      {showResultPopup && (
        <TrainerSessionReport 
          session={sessionResult} 
          capturedRecords={capturedRecords} 
          onClose={() => setShowResultPopup(false)} 
        />
      )}
    </div>
  );
};

export default SpeakingTrainerDashboard;
