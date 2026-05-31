import { useState, useEffect, useCallback } from "react";
import { useInterviewStore } from "../../store/useInterviewStore";
import { useWebcamStore } from "../../store/useWebcamStore";
import { WebcamFeed } from "../dashboard/WebcamFeed";
import { InterviewSessionReport } from "./InterviewSessionReport";
import { interviewService } from "../../services/interviewService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Sparkles,
  Activity,
  Award,
  ChevronRight,
  Clock,
  Square,
  HelpCircle,
  Video,
  User,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useToneEngine } from "../../hooks/useToneEngine";

export const InterviewCoachDashboard = () => {
  const {
    questions,
    currentQuestionIndex,
    activeMode,
    interviewSession,
    report,
    isInterviewRunning,
    showReportModal,
    telemetry,
    fetchQuestions,
    startInterview,
    nextQuestion,
    endInterview,
    setShowReportModal,
    setTelemetry,
    resetInterview,
  } = useInterviewStore();

  const {
    isModelReady,
    setDetecting,
    faces,
  } = useWebcamStore();

  const {
    liveEnergy,
    livePace,
    liveHesitation,
    startCapture,
    stopCapture,
  } = useToneEngine();

  const [modeSelection, setModeSelection] = useState("self_intro");
  const [setupStep, setSetupStep] = useState(true);
  const [preCountdown, setPreCountdown] = useState(0);
  const [isPreCountdownActive, setIsPreCountdownActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);

  // Load questions when mode changes
  useEffect(() => {
    fetchQuestions(modeSelection);
  }, [modeSelection, fetchQuestions]);

  // Clean up store on unmount
  useEffect(() => {
    return () => {
      resetInterview();
      setDetecting(false);
      try {
        stopCapture();
      } catch {
        // Ignore error
      }
    };
  }, [resetInterview, setDetecting, stopCapture]);

  // Timer Tick
  useEffect(() => {
    if (!isInterviewRunning) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isInterviewRunning]);

  // Handle live telemetry sync from face detections
  useEffect(() => {
    if (isInterviewRunning && faces && faces.length > 0) {
      const face = faces[0];
      const scores = face.emotion_scores;
      
      // Calculate live values to render gauges
      const happy = scores.happy || 0.0;
      const neutral = scores.neutral || 0.0;
      const surprise = scores.surprise || 0.0;
      const fear = scores.fear || 0.0;
      const sad = scores.sad || 0.0;
      const angry = scores.angry || 0.0;
      
      const pos = happy * 1.2 + neutral * 1.0 + surprise * 0.4;
      const neg = fear * 1.5 + sad * 1.0 + angry * 1.0;
      const baseConfidence = 50.0 + (pos - neg);
      const conf = Math.round(Math.max(5, Math.min(100, baseConfidence)));
      
      // Calculate centering focus
      const box = face.box;
      const cx = box.x + box.width / 2.0;
      const cy = box.y + box.height / 2.0;
      const offX = Math.abs(cx - 240.0) / 240.0;
      const offY = Math.abs(cy - 180.0) / 180.0;
      const centering = Math.max(0, 1.0 - (offX + offY) / 2.0);
      const focus = Math.round(60 + centering * 40);

      // Energy index from box variances and happy expressions
      const energy = Math.round(Math.min(100, Math.max(10, happy * 0.5 + 40)));
      
      setTelemetry({
        confidence: conf,
        focus: focus,
        stability: 80, // steady default
        energy: energy,
      });

      // Submit frame to backend for persistence
      if (interviewSession) {
        interviewService.submitFrame(interviewSession.id, {
          dominant_emotion: face.dominant_emotion,
          confidence: face.confidence,
          happy: happy,
          sad: sad,
          angry: angry,
          neutral: neutral,
          fear: fear,
          surprise: surprise,
          disgust: scores.disgust || 0.0,
          box_x: Math.round(box.x),
          box_y: Math.round(box.y),
          box_w: Math.round(box.width),
          box_h: Math.round(box.height),
        }).catch(err => console.error("Error submitting frame log:", err));
      }
    }
  }, [faces, isInterviewRunning, interviewSession, setTelemetry]);

  const startInterviewSession = useCallback(async () => {
    setTimer(0);
    try {
      await startInterview(modeSelection);
      setDetecting(true);
      await startCapture();
    } catch {
      alert("Failed to start session. Check if backend is running.");
      setSetupStep(true);
    }
  }, [startInterview, modeSelection, setDetecting, startCapture, setSetupStep]);

  // Pre-Countdown
  useEffect(() => {
    if (!isPreCountdownActive) return;

    const preTimer = setInterval(() => {
      setPreCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(preTimer);
          setIsPreCountdownActive(false);
          startInterviewSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(preTimer);
  }, [isPreCountdownActive, startInterviewSession]);

  const handleStartSetup = () => {
    setSetupStep(false);
    setPreCountdown(3);
    setIsPreCountdownActive(true);
  };

  const handleNextQuestion = () => {
    const hasNext = nextQuestion();
    if (!hasNext) {
      handleEndInterview();
    }
  };

  const handleEndInterview = async () => {
    setIsSubmitting(true);
    setDetecting(false);
    let audioMetrics = null;
    try {
      audioMetrics = stopCapture();
    } catch (e) {
      console.error("Error stopping voice capture:", e);
    }
    try {
      await endInterview(audioMetrics);
    } catch {
      alert("Failed to close interview report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive live feedback based on telemetry / faces
  let liveFeedback = "Establish neutral face posture and focus directly on the camera lens.";
  if (isInterviewRunning && faces && faces.length > 0) {
    const face = faces[0];
    const scores = face.emotion_scores;
    const happy = scores.happy || 0.0;
    const neutral = scores.neutral || 0.0;
    const surprise = scores.surprise || 0.0;
    const fear = scores.fear || 0.0;
    const sad = scores.sad || 0.0;
    const angry = scores.angry || 0.0;
    
    const pos = happy * 1.2 + neutral * 1.0 + surprise * 0.4;
    const neg = fear * 1.5 + sad * 1.0 + angry * 1.0;
    const baseConfidence = 50.0 + (pos - neg);
    const conf = Math.round(Math.max(5, Math.min(100, baseConfidence)));

    const box = face.box;
    const cx = box.x + box.width / 2.0;
    const cy = box.y + box.height / 2.0;
    const offX = Math.abs(cx - 240.0) / 240.0;
    const offY = Math.abs(cy - 180.0) / 180.0;
    const centering = Math.max(0, 1.0 - (offX + offY) / 2.0);
    const focus = Math.round(60 + centering * 40);

    if (focus < 65) {
      liveFeedback = "Camera focus lost. Look straight at the lens.";
    } else if (conf < 40) {
      liveFeedback = "Take a slow breath, lift your chin, and smile slightly.";
    } else {
      liveFeedback = "Eye contact stable. Pacing looks ideal.";
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getModeLabel = (mode) => {
    if (mode === "self_intro") return "Self Introduction";
    if (mode === "hr") return "HR Mock Interview";
    return "Behavioral Challenge";
  };

  const getConfidenceColor = (score) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-primary";
    return "text-accent-danger";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative min-h-screen">
      {/* Background glow animations */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header section */}
      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" /> Flagship Module V3.0
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 font-display">
            <Video className="h-8 w-8 text-primary" /> AI Interview Coach
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate realistic mock interviews under the guidance of our interactive webcam coaching engine.
          </p>
        </div>
      </div>

      {setupStep ? (
        /* SETUP / CONFIGURATION VIEW */
        <div className="max-w-xl mx-auto relative z-10">
          <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2 font-display">
                Configure Mock Scenario
              </CardTitle>
              <CardDescription>Select an interview focus area to launch the camera portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Select Buttons */}
              <div className="space-y-3">
                {[
                  { id: "self_intro", icon: User, label: "Self Introduction", desc: "Introduce your technical skills, projects, and career choices." },
                  { id: "hr", icon: MessageSquare, label: "HR Mock Interview", desc: "Standard corporate questions on goals, strengths, and vision." },
                  { id: "behavioral", icon: Award, label: "Behavioral Situations", desc: "Evaluate conflict management, problem solving, and STAR methodology." }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setModeSelection(mode.id)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200",
                      modeSelection === mode.id
                        ? "bg-primary/10 border-primary shadow-glow-sm"
                        : "border-border bg-background/50 hover:bg-surface"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-lg border", modeSelection === mode.id ? "bg-primary/20 border-primary/30 text-primary" : "bg-surface border-border text-muted-foreground")}>
                      <mode.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-display">{mode.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Requirements checklist */}
              <div className="bg-background/40 p-4 rounded-xl border border-border/40 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1 uppercase tracking-wider">Before starting check:</p>
                <p className="flex items-center gap-1.5">✅ Webcam is plugged in & permission allowed</p>
                <p className="flex items-center gap-1.5">✅ Lighting is sufficient for facial landmarks</p>
                <p className="flex items-center gap-1.5">✅ Place is quiet for spoken tone analysis</p>
              </div>

              <Button
                variant="primary"
                onClick={handleStartSetup}
                disabled={!isModelReady}
                className="w-full gap-2 font-bold py-3.5"
              >
                {!isModelReady ? (
                  <>Initializing AI Engine...</>
                ) : (
                  <>
                    Enter Interview Portal <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* INTERVIEW SCREEN VIEW */
        <div className="grid lg:grid-cols-12 gap-8 relative z-10">
          {/* Left Side Column: Config & Webcam Feed (4/12 width) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                  Active Interview
                </CardTitle>
                <CardDescription>{getModeLabel(activeMode)}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Question progression</span>
                  <span className="font-bold text-foreground">
                    {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / (questions.length || 1)) * 100}%` }}
                  />
                </div>

                <div className="pt-4 border-t border-border/30 flex flex-col gap-3">
                  <Button
                    variant="primary"
                    className="w-full gap-2 font-bold"
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                  >
                    {currentQuestionIndex + 1 === questions.length ? (
                      <>
                        <Square className="h-4 w-4" /> Finish Mock session
                      </>
                    ) : (
                      <>
                        Next Question <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetInterview();
                      setSetupStep(true);
                      setDetecting(false);
                      try {
                        stopCapture();
                      } catch {
                        // Ignore error
                      }
                    }}
                    className="w-full"
                  >
                    Cancel Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Webcam Feed Viewer Container */}
            <div className="relative group rounded-xl overflow-hidden border border-border bg-background p-1 shadow-elevated">
              <WebcamFeed sessionType="speaking" scriptText={`Interview: ${activeMode}`} />
            </div>
          </div>

          {/* Right Column: Question Panel & Telemetry Gauges (8/12 width) */}
          <div className="lg:col-span-8 grid md:grid-cols-12 gap-6">
            {/* Question Screen Card */}
            <Card className="md:col-span-7 flex flex-col h-[520px] border-border/50 bg-surface/30 backdrop-blur-xl shadow-elevated relative justify-between">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                  <HelpCircle className="h-5 w-5 text-primary" /> Active Mock Question
                </CardTitle>
                <CardDescription>Speak directly into your camera as you formulate your response.</CardDescription>
              </CardHeader>
              
              <div className="flex-grow p-8 flex flex-col justify-center items-center text-center">
                {questions.length > 0 && (
                  <div className="space-y-6">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-foreground leading-snug max-w-lg font-display">
                      "{questions[currentQuestionIndex]?.text}"
                    </h2>
                  </div>
                )}
              </div>

              {/* Bottom Timer Status panel */}
              <div className="p-4 border-t border-border/30 bg-background/60 rounded-b-xl flex items-center justify-between text-muted-foreground text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-muted-foreground font-display">Scenario Duration</span>
                </div>
                <span className="text-xl font-black text-foreground font-mono tracking-wider">
                  {formatTimer(timer)}
                </span>
              </div>
            </Card>

            {/* Right Column: Telemetry Gauge Panel */}
            <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
              {/* Live Metrics Card */}
              <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated flex-grow">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-base text-foreground flex items-center gap-2 font-display">
                    <Activity className="h-4.5 w-4.5 text-accent-success" /> Mock Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Confidence Meter */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Confidence Index
                      </span>
                      <span className={`text-base font-black ${getConfidenceColor(telemetry.confidence)}`}>
                        {telemetry.confidence}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-350"
                        style={{ width: `${telemetry.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Focus Indicator */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Eye Alignment
                      </span>
                      <span className="text-base font-black text-accent">
                        {telemetry.focus}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-350"
                        style={{ width: `${telemetry.focus}%` }}
                      />
                    </div>
                  </div>

                  {/* Energy Indicator */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Motion Energy
                      </span>
                      <span className="text-base font-black text-accent-danger">
                        {telemetry.energy}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-accent-danger rounded-full transition-all duration-350"
                        style={{ width: `${telemetry.energy}%` }}
                      />
                    </div>
                  </div>

                  {/* Vocal Energy Meter */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Voice Energy
                      </span>
                      <span className="text-base font-black text-primary">
                        {liveEnergy}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-350"
                        style={{ width: `${liveEnergy}%` }}
                      />
                    </div>
                  </div>

                  {/* Speech Rhythm / Pace */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Speech Pace
                      </span>
                      <span className="text-base font-black text-accent-success">
                        {livePace} ZCR
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-accent-success rounded-full transition-all duration-350"
                        style={{ width: `${Math.min(100, livePace)}%` }}
                      />
                    </div>
                  </div>

                  {/* Speech Hesitation */}
                  <div className="space-y-2 bg-background/30 p-3.5 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-display">
                        Speech Hesitation
                      </span>
                      <span className="text-base font-black text-amber-500">
                        {liveHesitation}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-350"
                        style={{ width: `${liveHesitation}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coaching Tips Module */}
              <Card className="border-border/50 bg-surface/40 backdrop-blur-xl shadow-elevated min-h-[140px]">
                <CardHeader className="pb-2 border-b border-border/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-display">
                    <Sparkles className="h-4 w-4 text-primary" /> Live Coach Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex gap-2 items-start text-xs text-foreground/80 leading-relaxed">
                    <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{liveFeedback}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 3s Count-down screen overlay */}
      {isPreCountdownActive && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 animate-in fade-in duration-250">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary block mb-4 animate-pulse">
              Entering Mock scenario...
            </span>
            <div className="text-8xl font-black text-foreground animate-bounce">{preCountdown}</div>
            <p className="text-muted-foreground text-xs mt-6">Prepare to speak and present clearly.</p>
          </div>
        </div>
      )}

      {/* Concluding Session Report popup modal */}
      {showReportModal && (
        <InterviewSessionReport session={report} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
};

export default InterviewCoachDashboard;
