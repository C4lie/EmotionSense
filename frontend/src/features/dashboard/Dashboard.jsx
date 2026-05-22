import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WebcamFeed } from "./WebcamFeed";
import { ControlPanel } from "./ControlPanel";
import { useWebcamStore } from "../../store/useWebcamStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Smile,
  ShieldAlert,
  Frown,
  Meh,
  Flame,
  Skull,
  Sparkles,
  AlertCircle,
  X,
  BarChart2,
  Tv,
  Cpu,
  Sliders,
  Volume2,
  RefreshCw,
  History,
  Trash2,
  HelpCircle
} from "lucide-react";
import { analyticsService } from "../../services/analyticsService";
import { Loader } from "../../components/ui/Loader";
import { WelcomeTour } from "./WelcomeTour";

// Themes for styling based on dominant emotion
const EMOTION_THEMES = {
  happy: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5",
    barColor: "bg-emerald-500",
    label: "Happy",
    icon: Smile,
  },
  sad: {
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-blue-500/5",
    barColor: "bg-blue-500",
    label: "Sad",
    icon: Frown,
  },
  angry: {
    color: "text-red-400 bg-red-500/10 border-red-500/30 shadow-red-500/5",
    barColor: "bg-red-500",
    label: "Angry",
    icon: Flame,
  },
  neutral: {
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30 shadow-zinc-500/5",
    barColor: "bg-zinc-500",
    label: "Neutral",
    icon: Meh,
  },
  fear: {
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-purple-500/5",
    barColor: "bg-purple-500",
    label: "Fear",
    icon: Skull,
  },
  surprise: {
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/5",
    barColor: "bg-amber-500",
    label: "Surprise",
    icon: Sparkles,
  },
  disgust: {
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/5",
    barColor: "bg-rose-500",
    label: "Disgust",
    icon: AlertCircle,
  },
};

const EMOTION_LABELS = {
  happy: "Happy 😊",
  sad: "Sad 😢",
  angry: "Angry 😠",
  neutral: "Neutral 😐",
  fear: "Fear 😨",
  surprise: "Surprise 😲",
  disgust: "Disgust 🤢",
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    faces,
    isDetecting,
    showResultPopup,
    sessionResult,
    setShowResultPopup,
  } = useWebcamStore();

  const [isSkeletonLoading, setIsSkeletonLoading] = useState(true);
  const [historySessions, setHistorySessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await analyticsService.getSessions(1, 10);
      setHistorySessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to load history sessions", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sessionResult]);

  const handleDeleteHistorySession = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await analyticsService.deleteSession(id);
      loadHistory();
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const triggerSkeleton = () => {
    setIsSkeletonLoading(true);
    setTimeout(() => {
      setIsSkeletonLoading(false);
    }, 2000);
  };

  const primaryFace = faces[0];
  const dominantEmotion = sessionResult?.dominant_emotion || "neutral";
  const theme = EMOTION_THEMES[dominantEmotion] || EMOTION_THEMES.neutral;
  const EmotionIcon = theme.icon;

  const handleViewAnalytics = () => {
    setShowResultPopup(false);
    navigate("/analytics");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Decorative gradient glow background */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Page Header */}
      <div className="mb-8 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <Cpu className="h-3 w-3" /> AI Core V1.0
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Tv className="h-8 w-8 text-primary" /> Live Emotion Analysis
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Capture facial feeds in real-time and review predictive neural network breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWelcomeTour(true)}
            className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <HelpCircle className="h-4 w-4" /> Quick Tour Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerSkeleton}
            className="gap-2 border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 text-primary" /> Trigger Loading (2s)
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      {isSkeletonLoading ? (
        <div className="grid lg:grid-cols-3 gap-8 relative z-10" aria-busy="true" aria-live="polite">
          {/* Left Column: Webcam Viewer Skeleton (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-1 rounded-xl border border-zinc-800/60 bg-zinc-900/10 shadow-xl">
              <div className="skeleton skeleton--image rounded-lg" aria-hidden="true" />
            </div>

            {/* Metrics card skeleton */}
            <Card className="border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
              <CardHeader className="pb-3 border-b border-zinc-900/60">
                <CardTitle className="text-base text-white">
                  <div className="skeleton skeleton--text w-1/4" aria-hidden="true" />
                </CardTitle>
                <CardDescription>
                  <div className="skeleton skeleton--text-sm w-1/3 mt-2" aria-hidden="true" />
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Profile Header Pattern: avatar on left, two text lines on right */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/20">
                  <div className="skeleton skeleton--circle w-14 h-14 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="skeleton skeleton--text" style={{ width: "40%" }} aria-hidden="true" />
                    <div className="skeleton skeleton--text-sm" style={{ width: "65%" }} aria-hidden="true" />
                  </div>
                </div>

                {/* Metric bars skeletons */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2.5 bg-zinc-950/10 p-3 rounded-lg border border-zinc-850/40">
                      <div className="flex justify-between items-center">
                        <div className="skeleton skeleton--text w-20" aria-hidden="true" />
                        <div className="skeleton skeleton--text w-8" aria-hidden="true" />
                      </div>
                      <div className="skeleton skeleton--text-sm w-full" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Control Deck Skeleton (1/3 width) */}
          <div>
            <Card className="h-full border-zinc-850 bg-zinc-900/20 backdrop-blur-xl shadow-lg">
              <CardHeader className="border-b border-zinc-900/60">
                <CardTitle className="text-white">
                  <div className="skeleton skeleton--text w-1/3" aria-hidden="true" />
                </CardTitle>
                <CardDescription>
                  <div className="skeleton skeleton--text-sm w-1/2 mt-2" aria-hidden="true" />
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Content List Pattern: 4 rows with 40px avatars and text lines */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="flex items-center gap-4 py-3.5 border-b border-zinc-850/40 last:border-0 last:pb-0 first:pt-0" aria-hidden="true">
                      <div className="skeleton skeleton--circle w-10 h-10 flex-shrink-0" />
                      <div className="flex-grow flex flex-col gap-2">
                        <div className="skeleton skeleton--text" style={{ width: "55%" }} />
                        <div className="skeleton skeleton--text-sm" style={{ width: "35%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          {/* Left Column: Webcam Viewer (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-1 bg-gradient-to-b from-zinc-800/20 to-zinc-950/20 shadow-xl">
              <WebcamFeed />
            </div>

            {/* Metrics / Instant Emotion breakdown overlay */}
            <Card className="border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
              <CardHeader className="pb-3 border-b border-zinc-900/60">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Smile className="h-5 w-5 text-primary" /> Live Expression Metrics
                </CardTitle>
                <CardDescription>Detected facial metrics and emotion weight distribution.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isDetecting && primaryFace ? (
                  <div className="space-y-6">
                    {/* Dominant Emotion callout */}
                    {(() => {
                      const domEmo = primaryFace.dominant_emotion?.toLowerCase() || "neutral";
                      const faceTheme = EMOTION_THEMES[domEmo] || EMOTION_THEMES.neutral;
                      const FaceIcon = faceTheme.icon;

                      return (
                        <div className={`flex items-center justify-between p-4 rounded-xl border ${faceTheme.color} shadow-sm transition-all duration-300`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-zinc-900 border border-white/5`}>
                              <FaceIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Dominant Expression</span>
                              <span className="text-lg font-extrabold capitalize text-white">
                                {domEmo}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Confidence</span>
                            <span className="text-xl font-black text-white">
                              {Math.round(primaryFace.confidence)}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Horizontal Bar Breakdown for 7 emotions */}
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                      {Object.entries(primaryFace.emotion_scores || {})
                        .sort((a, b) => b[1] - a[1]) // Sort by highest percentage
                        .map(([emotion, score]) => {
                          const percentage = Math.round(score);
                          const emoTheme = EMOTION_THEMES[emotion.toLowerCase()] || EMOTION_THEMES.neutral;
                          return (
                            <div key={emotion} className="space-y-1.5 bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/40">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-300">
                                  {EMOTION_LABELS[emotion.toLowerCase()] || emotion}
                                </span>
                                <span className="font-bold text-white">{percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className={`h-full ${emoTheme.barColor} rounded-full transition-all duration-500 ease-out`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-850 mb-3">
                      <ShieldAlert className="h-6 w-6 text-zinc-500" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-400">
                      {isDetecting ? "Looking for faces..." : "Start the camera detection to analyze expression metrics."}
                    </p>
                    <p className="text-xs text-zinc-500 max-w-xs mt-1">
                      {isDetecting ? "Ensure your face is clearly visible and well-lit." : "Use the Control Deck on the right to trigger the live model."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Controls & AI configuration (1/3 width) */}
          <div>
            <Card className="h-full border-zinc-850 bg-zinc-900/20 backdrop-blur-xl shadow-lg">
              <CardHeader className="p-4 sm:p-6 border-b border-zinc-900/60">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                  <Sliders className="h-5 w-5 text-primary" /> Control Deck
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configure video resolutions, speeds, and run triggers.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-6 sm:pt-6">
                <ControlPanel />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Session History Section */}
      <div className="mt-12 relative z-10">
        <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Recent Session History
            </h2>
          </div>
          <span className="text-xs text-zinc-400">Showing last 10 sessions</span>
        </div>

        <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-xl shadow-lg">
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-12">
                <Loader text="Loading session history..." />
              </div>
            ) : historySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 m-4">
                <History className="h-10 w-10 text-zinc-650 mb-3" />
                <p className="text-sm font-semibold text-zinc-400">No sessions recorded yet</p>
                <p className="text-xs text-zinc-500 mt-1">Start a recording above to capture live expressions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-850 text-xs font-semibold text-zinc-400 uppercase bg-zinc-950/20">
                      <th className="py-4 px-6">Date & Time</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-center">Dominant Emotion</th>
                      <th className="py-4 px-6 text-right">Avg Confidence</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60">
                    {historySessions.map((session) => {
                      const domEmo = session.dominant_emotion?.toLowerCase() || "neutral";
                      const emoTheme = EMOTION_THEMES[domEmo] || EMOTION_THEMES.neutral;
                      const EmoIcon = emoTheme.icon;

                      // Format localized date
                      const dateObj = new Date(session.started_at);
                      const formattedDate = dateObj.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const formattedTime = dateObj.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-white/[0.02] text-sm text-zinc-350 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-white">
                            <div>{formattedDate}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{formattedTime}</div>
                          </td>
                          <td className="py-4 px-6 uppercase tracking-wider text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 font-semibold`}>
                              {session.session_type || "live"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${emoTheme.color}`}
                            >
                              <EmoIcon className="h-3.5 w-3.5" />
                              {emoTheme.label}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-zinc-200">
                            {session.average_confidence != null
                              ? `${Math.round(session.average_confidence)}%`
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteHistorySession(session.id)}
                              className="p-2 rounded-lg bg-zinc-950/40 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 transition-all duration-300"
                              title="Delete Session"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Premium Glassmorphic Results Modal */}
      {showResultPopup && sessionResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in-50 zoom-in-95 slide-in-from-bottom-8 duration-300 backdrop-blur-2xl">
            {/* Ambient Modal Glow */}
            <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-2xl ${theme.barColor}`} />

            {/* Close Button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-950/45 hover:bg-zinc-800 border border-white/5 text-muted-foreground hover:text-white transition-all duration-300"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header info */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className={`p-4 rounded-full border ${theme.color} mb-4 animate-bounce`}>
                <EmotionIcon className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Session Complete!
              </h2>
              <p className="text-xs text-zinc-400 mt-2 px-4 leading-relaxed">
                We processed <span className="text-white font-bold">{sessionResult.total_frames}</span> frames over <span className="text-white font-bold">{sessionResult.duration || 10}s</span>. Your primary emotional state was:
              </p>
              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${theme.color}`}>
                  {theme.label} ({Math.round(sessionResult.average_confidence)}% confidence)
                </span>
              </div>
            </div>

            {/* Content: Detailed Breakdown */}
            <div className="space-y-4 mb-8 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Session Fingerprint
              </h3>
              <div className="grid grid-cols-1 gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                {Object.entries(sessionResult.emotion_percentages || {})
                  .sort((a, b) => b[1] - a[1]) // Sort descending
                  .map(([emotion, percentage]) => {
                    const emotTheme = EMOTION_THEMES[emotion] || EMOTION_THEMES.neutral;
                    return (
                      <div key={emotion} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-zinc-300">
                            {EMOTION_LABELS[emotion] || emotion}
                          </span>
                          <span className="font-bold text-white">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full ${emotTheme.barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleViewAnalytics}
                className="flex-1 gap-2 font-semibold shadow-lg shadow-primary/10"
              >
                <BarChart2 className="h-4 w-4" /> View Full Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResultPopup(false)}
                className="flex-1 font-semibold border-zinc-800 hover:bg-zinc-900"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Onboarding Welcome Tour */}
      <WelcomeTour forceOpen={showWelcomeTour} onClose={() => setShowWelcomeTour(false)} />
    </div>
  );
};

export default Dashboard;
