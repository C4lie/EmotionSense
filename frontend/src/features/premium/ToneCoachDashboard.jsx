import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useToneAnalysisStore } from "../../store/useToneAnalysisStore";
import { useToneEngine } from "../../hooks/useToneEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import ToneCoachReport from "../../components/ToneCoachReport";
import {
  Mic,
  MicOff,
  Crown,
  Activity,
  Zap,
  Timer,
  TrendingUp,
  Loader2,
  Lock,
  ChevronRight,
  Sparkles,
  BarChart2,
  Volume2,
} from "lucide-react";

/**
 * ToneCoachDashboard
 * Premium feature page for AI tone coaching.
 *
 * Flow:
 *   1. Check premium gate — redirect to /pricing if free user
 *   2. User clicks "Start Session" → microphone capture begins
 *   3. Live metrics displayed in real-time gauges
 *   4. User clicks "Stop & Analyze" → stopCapture() + submitForAnalysis()
 *   5. ToneCoachReport modal displays the full coaching result
 */
const ToneCoachDashboard = () => {
  const navigate = useNavigate();
  const { isPremium, isLoading: subLoading } = useSubscriptionStore();
  const {
    isSessionActive,
    coachingReport,
    showReport,
    isAnalyzing,
    error,
    setSessionActive,
    updateLiveMetrics,
    submitForAnalysis,
    closeReport,
    clearError,
  } = useToneAnalysisStore();

  const {
    startCapture,
    stopCapture,
    isCapturing,
    liveEnergy,
    livePace,
    liveHesitation,
  } = useToneEngine();

  // Keep live metrics in store in sync with hook values
  useEffect(() => {
    if (isCapturing) {
      updateLiveMetrics({
        energyLevel: liveEnergy,
        paceScore: livePace,
        hesitationRate: liveHesitation,
      });
    }
  }, [liveEnergy, livePace, liveHesitation, isCapturing, updateLiveMetrics]);

  // Sync hook isCapturing with store isSessionActive
  useEffect(() => {
    setSessionActive(isCapturing);
  }, [isCapturing, setSessionActive]);

  // Handle start session
  const handleStartSession = async () => {
    clearError();
    const granted = await startCapture();
    if (!granted) {
      useToneAnalysisStore.setState({
        error: "Microphone access denied. Please allow microphone permissions and try again.",
      });
    }
  };

  // Handle stop and analyze
  const handleStopAndAnalyze = async () => {
    const audioMetrics = stopCapture();
    try {
      await submitForAnalysis(audioMetrics, [], null);
    } catch {
      // Error is already set in store
    }
  };

  // Premium gate — redirect free users
  if (!subLoading && !isPremium) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center relative">
        <div className="absolute top-10 left-1/3 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
            <Lock className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Premium Feature</h1>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            AI Tone Coaching requires a premium subscription. Upgrade now — it's free during our
            beta launch.
          </p>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold border-none shadow-lg shadow-amber-500/20"
            onClick={() => navigate("/pricing")}
          >
            <Crown className="h-4 w-4" /> Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  const liveMetrics = [
    {
      label: "Vocal Energy",
      value: liveEnergy,
      icon: <Volume2 className="h-3.5 w-3.5 text-rose-400" />,
      color: "bg-rose-500",
    },
    {
      label: "Speech Pace",
      value: livePace,
      icon: <Timer className="h-3.5 w-3.5 text-indigo-400" />,
      color: "bg-indigo-500",
    },
    {
      label: "Fluency",
      value: Math.max(0, 100 - liveHesitation),
      icon: <Activity className="h-3.5 w-3.5 text-emerald-400" />,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative min-h-screen">
      {/* Glow overlays */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Page header */}
      <div className="relative z-10 mb-8 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
          <Crown className="h-3 w-3" /> Premium Feature
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Mic className="h-8 w-8 text-amber-400" /> AI Tone Coach
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Analyze your vocal delivery in real-time. Receive AI coaching on energy, pace, and
              hesitation.
            </p>
          </div>
          {isCapturing && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Recording Live
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-8">
        {/* Left: Controls + Live Metrics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Session Control Card */}
          <Card className="glass border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Session Controls
              </CardTitle>
              <CardDescription>
                {isCapturing
                  ? "Recording in progress. Speak naturally into your microphone."
                  : "Click Start to begin capturing your voice for analysis."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 text-center">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-all duration-300 ${
                    isCapturing
                      ? "bg-rose-500/10 border border-rose-500/30"
                      : "bg-zinc-800/60 border border-zinc-700"
                  }`}
                >
                  {isCapturing ? (
                    <Mic className="h-7 w-7 text-rose-400 animate-pulse" />
                  ) : (
                    <MicOff className="h-7 w-7 text-zinc-500" />
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {isCapturing
                    ? "Microphone active — speak clearly"
                    : "Microphone inactive"}
                </p>
              </div>

              {/* Error display */}
              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-2">
                {!isCapturing ? (
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold border-none shadow-lg shadow-amber-500/20"
                    onClick={handleStartSession}
                    disabled={isAnalyzing}
                  >
                    <Mic className="h-4 w-4" /> Start Session
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full font-bold"
                    onClick={handleStopAndAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><TrendingUp className="h-4 w-4" /> Stop &amp; Analyze</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="glass border-zinc-850 bg-zinc-900/30 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-400" /> How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                "Grant microphone access when prompted.",
                "Click Start Session and speak naturally for 15–60 seconds.",
                "Click Stop & Analyze to generate your AI coaching report.",
                "Review your scores and personalized recommendations.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Metrics + Tips */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Metrics Card */}
          <Card className="glass border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-900/60">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <BarChart2 className="h-4.5 w-4.5 text-emerald-400" /> Live Vocal Metrics
              </CardTitle>
              <CardDescription>
                {isCapturing
                  ? "Real-time analysis from your microphone feed."
                  : "Start a session to see live metrics."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {liveMetrics.map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="space-y-2 bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-850/40"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      {icon} {label}
                    </span>
                    <span className="text-base font-black text-white">{value}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                  </div>
                </div>
              ))}

              {!isCapturing && (
                <div className="text-center py-8 text-zinc-600">
                  <Mic className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Start a session to see live audio metrics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past report shortcut */}
          <Card className="glass border-zinc-850 bg-zinc-900/30 backdrop-blur-xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">View Past Reports</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  See your coaching history and track improvement over time.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate("/tone-history")}>
                History <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coaching Report Modal */}
      {showReport && coachingReport && (
        <ToneCoachReport report={coachingReport} onClose={closeReport} />
      )}
    </div>
  );
};

export default ToneCoachDashboard;
