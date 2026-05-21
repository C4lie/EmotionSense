import React from "react";
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
} from "lucide-react";

// Themes for styling based on dominant emotion
const EMOTION_THEMES = {
  happy: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    barColor: "bg-emerald-500",
    glowColor: "shadow-emerald-500/20",
    label: "Happy",
    icon: Smile,
  },
  sad: {
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    barColor: "bg-blue-500",
    glowColor: "shadow-blue-500/20",
    label: "Sad",
    icon: Frown,
  },
  angry: {
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    barColor: "bg-red-500",
    glowColor: "shadow-red-500/20",
    label: "Angry",
    icon: Flame,
  },
  neutral: {
    color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    barColor: "bg-slate-400",
    glowColor: "shadow-slate-500/20",
    label: "Neutral",
    icon: Meh,
  },
  fear: {
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    barColor: "bg-purple-500",
    glowColor: "shadow-purple-500/20",
    label: "Fear",
    icon: Skull,
  },
  surprise: {
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    barColor: "bg-amber-500",
    glowColor: "shadow-amber-500/20",
    label: "Surprise",
    icon: Sparkles,
  },
  disgust: {
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    barColor: "bg-rose-500",
    glowColor: "shadow-rose-500/20",
    label: "Disgust",
    icon: AlertCircle,
  },
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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Smile className="h-8 w-8 text-primary" /> Live Emotion Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture facial feeds in real-time and review predictive neural network breakdowns.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Webcam Viewer (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <WebcamFeed />

          {/* Metrics / Instant Emotion breakdown overlay */}
          <Card className="bg-card/25 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" /> Live Expression Metrics
              </CardTitle>
              <CardDescription>Detected facial metrics and emotion weight distribution.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDetecting && primaryFace ? (
                <div className="space-y-4">
                  {/* Dominant Emotion callout */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium">Dominant Expression</span>
                    <span className="text-base font-bold text-primary uppercase">
                      {primaryFace.dominant_emotion} ({Math.round(primaryFace.confidence)}%)
                    </span>
                  </div>

                  {/* Horizontal Bar Breakdown for 7 emotions */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {Object.entries(primaryFace.emotion_scores || {}).map(([emotion, score]) => {
                      const percentage = Math.round(score);
                      return (
                        <div key={emotion} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="capitalize font-medium text-muted-foreground">{emotion}</span>
                            <span className="font-semibold text-white">{percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed border-white/5 rounded-lg bg-zinc-900/10">
                  <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {isDetecting ? "Looking for faces..." : "Start the camera detection to analyze expression metrics."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & AI configuration (1/3 width) */}
        <div>
          <Card className="h-full border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle>Control Deck</CardTitle>
              <CardDescription>Configure video resolutions, speeds, and run triggers.</CardDescription>
            </CardHeader>
            <CardContent>
              <ControlPanel />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Glassmorphic Results Modal */}
      {showResultPopup && sessionResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className={`p-4 rounded-full border ${theme.color} shadow-lg ${theme.glowColor} mb-4`}>
                <EmotionIcon className="h-10 w-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Session Complete!
              </h2>
              <p className="text-sm text-muted-foreground mt-2 px-4">
                We processed {sessionResult.total_frames} frames over 10 seconds. Your dominant state was:
              </p>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${theme.color}`}>
                  {theme.label} ({Math.round(sessionResult.average_confidence)}% confidence)
                </span>
              </div>
            </div>

            {/* Content: Detailed Breakdown */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-white/5 pb-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Emotion Fingerprint
              </h3>
              <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {Object.entries(sessionResult.emotion_percentages || {})
                  .sort((a, b) => b[1] - a[1]) // Sort descending
                  .map(([emotion, percentage]) => {
                    const emotTheme = EMOTION_THEMES[emotion] || EMOTION_THEMES.neutral;
                    return (
                      <div key={emotion} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="capitalize font-medium text-foreground">{emotion}</span>
                          <span className="font-semibold text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${emotTheme.barColor} rounded-full`}
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
                className="flex-1 gap-2 font-medium"
              >
                <BarChart2 className="h-4 w-4" /> View Full Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResultPopup(false)}
                className="flex-1 font-medium"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
