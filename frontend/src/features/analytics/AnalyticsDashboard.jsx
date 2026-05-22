import React, { useState, useEffect } from "react";
import { analyticsService } from "../../services/analyticsService";
import { MoodTimeline } from "./MoodTimeline";
import { DistributionChart } from "./DistributionChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import {
  TrendingUp,
  BarChart3,
  Clock,
  Trash2,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Smile,
  ShieldAlert,
  CalendarDays,
  Target,
  History,
  RefreshCw,
  BookOpen,
  Activity,
  Heart,
  Mic
} from "lucide-react";

const EMOTION_BADGES = {
  happy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sad: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  angry: "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  fear: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  surprise: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  disgust: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const EMOTION_EMOJIS = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
};

export const AnalyticsDashboard = () => {
  const [rangeDays, setRangeDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [sessionsData, setSessionsData] = useState({ sessions: [], total: 0 });
  const [page, setPage] = useState(1);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [isSkeletonLoading, setIsSkeletonLoading] = useState(true);

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

  // Fetch dashboard stats
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await analyticsService.getDashboardAnalytics(rangeDays);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics dashboard:", err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch sessions list
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await analyticsService.getSessions(page, 5);
      setSessionsData(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rangeDays]);

  useEffect(() => {
    fetchSessions();
  }, [page]);

  // Handle session delete
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session and all its records?")) {
      return;
    }
    try {
      await analyticsService.deleteSession(sessionId);
      fetchSessions();
      fetchAnalytics();
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // View session details
  const handleViewDetails = async (sessionId) => {
    setIsLoadingDetails(true);
    try {
      const details = await analyticsService.getSessionDetails(sessionId);
      setSelectedSession(details);
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMoodRating = (score) => {
    if (score >= 80) return { label: "Exceptional", color: "text-emerald-400", bar: "bg-emerald-500" };
    if (score >= 60) return { label: "Good", color: "text-blue-400", bar: "bg-blue-500" };
    if (score >= 40) return { label: "Neutral", color: "text-zinc-300", bar: "bg-zinc-400" };
    if (score >= 20) return { label: "Low", color: "text-amber-500", bar: "bg-amber-500" };
    return { label: "Poor", color: "text-red-500", bar: "bg-red-500" };
  };

  const totalPages = Math.ceil(sessionsData.total / 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header Deck */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-zinc-900 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="h-3 w-3" /> Historical metrics
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" /> Analytics Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review historical mood expressions, distribution parameters, and past logs.
          </p>
        </div>

        {/* Actions Deck */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerSkeleton}
            className="gap-2 border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 text-primary" /> Trigger Loading (2s)
          </Button>

          {/* Range Selectors */}
          <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 backdrop-blur-md">
            <button
              onClick={() => setRangeDays(7)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
                rangeDays === 7 ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRangeDays(30)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
                rangeDays === 30 ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {isSkeletonLoading || isLoadingAnalytics ? (
        <div className="space-y-8 relative z-10" aria-busy="true" aria-live="polite">
          {/* Analytics Stat Cards Skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="skeleton skeleton--text w-1/3" aria-hidden="true" />
                    <div className="skeleton skeleton--circle w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="skeleton skeleton--text w-1/2" style={{ height: "24px" }} aria-hidden="true" />
                  <div className="skeleton skeleton--text-sm w-3/4 mt-2" aria-hidden="true" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Deck Skeleton */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timeline (2/3 width) */}
            <Card className="lg:col-span-2 border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardHeader className="border-b border-zinc-900/40">
                <CardTitle>
                  <div className="skeleton skeleton--text w-1/4" aria-hidden="true" />
                </CardTitle>
                <CardDescription>
                  <div className="skeleton skeleton--text-sm w-1/3 mt-2" aria-hidden="true" />
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* 16:9 aspect ratio graph loading */}
                <div className="skeleton skeleton--image rounded-lg animate-pulse" style={{ minHeight: "260px" }} aria-hidden="true" />
              </CardContent>
            </Card>

            {/* Probability Weights (1/3 width) */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardHeader className="border-b border-zinc-900/40">
                <CardTitle>
                  <div className="skeleton skeleton--text w-1/3" aria-hidden="true" />
                </CardTitle>
                <CardDescription>
                  <div className="skeleton skeleton--text-sm w-1/2 mt-2" aria-hidden="true" />
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 flex flex-col items-center gap-6">
                {/* Circular skeleton donut loader */}
                <div className="skeleton skeleton--circle w-40 h-40" aria-hidden="true" />
                <div className="w-full space-y-2">
                  <div className="skeleton skeleton--text w-full" aria-hidden="true" />
                  <div className="skeleton skeleton--text-sm w-2/3" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions & Modal Layout Skeleton */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Past Session Logs (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-400" /> Past Session Logs
              </h3>

              <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-900/20">
                {/* Content List Pattern: 4 rows of 40px avatars and text lines */}
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
              </div>
            </div>

            {/* Session Inspector (1/3 width) */}
            <div>
              <Card className="h-full border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
                <CardHeader className="border-b border-zinc-900/40">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-zinc-400" /> Session Inspector
                  </CardTitle>
                  <CardDescription>Click a session's eye icon to inspect granular frames.</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px] pt-6 space-y-4">
                  <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-850/80 space-y-2">
                    <div className="skeleton skeleton--text w-2/3" aria-hidden="true" />
                    <div className="skeleton skeleton--text-sm w-1/2" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Captured snap records</h4>
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 rounded bg-zinc-950/20 border border-zinc-850/60">
                          <div className="skeleton skeleton--text w-1/2" aria-hidden="true" />
                          <div className="skeleton skeleton--text w-8" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          {/* Analytics Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mood Score */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">Positivity Score</span>
                  <Smile className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{analytics?.mood_score}%</span>
                  <span className={`text-xs font-bold ${getMoodRating(analytics?.mood_score || 0).color}`}>
                    {getMoodRating(analytics?.mood_score || 0).label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full mt-4 overflow-hidden border border-white/5">
                  <div
                    className={`h-full ${getMoodRating(analytics?.mood_score || 0).bar} rounded-full`}
                    style={{ width: `${analytics?.mood_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total Sessions */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">Total Sessions</span>
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">{analytics?.total_sessions}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-4 font-medium leading-none">
                  Active video/image runs in range.
                </p>
              </CardContent>
            </Card>

            {/* Total Detections */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">Total Records</span>
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">{analytics?.total_detections}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-4 font-medium leading-none">
                  Granular face snapshots logged.
                </p>
              </CardContent>
            </Card>

            {/* Dominant Trend */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">Dominant Trend</span>
                  {(() => {
                    const domEmo = analytics?.most_frequent_emotion?.toLowerCase() || "neutral";
                    const emoji = EMOTION_EMOJIS[domEmo] || "😐";
                    return <span className="text-lg">{emoji}</span>;
                  })()}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-white capitalize">
                    {analytics?.most_frequent_emotion || "None"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-5 font-medium leading-none">
                  Highest frequency classification.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Deck */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timeline Area (2/3 width) */}
            <Card className="lg:col-span-2 border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardHeader className="border-b border-zinc-900/40">
                <CardTitle className="flex items-center gap-2 text-white">
                  <CalendarDays className="h-5 w-5 text-primary" /> Mood Progression
                </CardTitle>
                <CardDescription>Daily dominant emotion indices over the active timeframe.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MoodTimeline data={analytics?.mood_timeline} />
              </CardContent>
            </Card>

            {/* Donut Distribution (1/3 width) */}
            <Card className="border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
              <CardHeader className="border-b border-zinc-900/40">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-purple-400" /> Probability Weights
                </CardTitle>
                <CardDescription>Overall breakdown of the 7 basic expressions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DistributionChart distribution={analytics?.emotion_distribution} />
              </CardContent>
            </Card>
          </div>

          {/* Sessions & Modal Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left/Middle: Paginated log table (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-400" /> Past Session Logs
              </h3>

              {isLoadingSessions ? (
                <div className="h-56 flex items-center justify-center bg-zinc-950/20 rounded-xl border border-zinc-850">
                  <Loader size="md" text="Loading logs..." />
                </div>
              ) : sessionsData.sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                  <ShieldAlert className="h-10 w-10 mb-2 opacity-50 text-zinc-500" />
                  <p className="text-sm font-semibold text-zinc-400">No historical sessions recorded.</p>
                  <p className="text-xs text-zinc-500 mt-1">Complete a live analysis or speaking session in the dashboard first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-zinc-950/30 backdrop-blur-md">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-850 text-xs text-zinc-400 font-bold bg-zinc-900/60 uppercase tracking-wider">
                          <th className="p-4">Date/Time</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Dominant</th>
                          <th className="p-4">Confidence</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/50 text-sm text-zinc-300">
                        {sessionsData.sessions.map((sess) => {
                          const domEmo = (sess.dominant_emotion || "neutral").toLowerCase();
                          const badgeStyle = EMOTION_BADGES[domEmo] || EMOTION_BADGES.neutral;
                          const emoji = EMOTION_EMOJIS[domEmo] || "😐";

                          return (
                            <tr key={sess.id} className="hover:bg-zinc-900/40 transition-all duration-300">
                              <td className="p-4 font-semibold text-white">{formatTime(sess.started_at)}</td>
                              <td className="p-4">
                                {sess.session_type === "speaking" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                    <Mic className="h-2.5 w-2.5" /> Speaking
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-zinc-800/60 text-zinc-400 border-zinc-700/30">
                                    Live
                                  </span>
                                )}
                              </td>
                              <td className="p-4 capitalize">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                                  <span className="text-xs">{emoji}</span>
                                  {sess.dominant_emotion || "guest run"}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-white">
                                {sess.average_confidence ? `${Math.round(sess.average_confidence)}%` : "N/A"}
                              </td>
                              <td className="p-4 text-right flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-zinc-800 hover:bg-zinc-900"
                                  onClick={() => handleViewDetails(sess.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDeleteSession(sess.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controller */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-zinc-400 font-medium">
                        Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          className="border-zinc-800 font-semibold"
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                          className="border-zinc-800 font-semibold"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Detailed Session Inspector (1/3 width) */}
            <div>
              <Card className="h-full border-zinc-850 bg-zinc-900/30 backdrop-blur-md shadow-lg">
                <CardHeader className="border-b border-zinc-900/40">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-zinc-400" /> Session Inspector
                  </CardTitle>
                  <CardDescription>Click a session's eye icon to inspect granular frames.</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px] overflow-y-auto pt-6">
                  {isLoadingDetails ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader text="Fetching details..." size="md" />
                    </div>
                  ) : selectedSession ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-850/80 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-semibold uppercase">Session ID</span>
                          <span className="font-mono text-zinc-300 truncate max-w-[150px]">{selectedSession.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-semibold uppercase">Started</span>
                          <span className="text-zinc-300">{formatTime(selectedSession.started_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-semibold uppercase">Type</span>
                          <span className="text-white font-bold capitalize">{selectedSession.session_type || "live"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-semibold uppercase">Dominant</span>
                          <span className="text-white font-bold capitalize">{selectedSession.dominant_emotion}</span>
                        </div>
                      </div>

                      {/* Speaking-type V2 score metrics */}
                      {selectedSession.session_type === "speaking" && (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Confidence", value: selectedSession.confidence_score, icon: TrendingUp, color: "text-blue-400" },
                            { label: "Stability", value: selectedSession.stability_score, icon: Activity, color: "text-purple-400" },
                            { label: "Eye Focus", value: selectedSession.eye_contact_score, icon: Eye, color: "text-emerald-400" },
                            { label: "Energy", value: selectedSession.speaking_energy, icon: Heart, color: "text-rose-400" },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="p-2 rounded-lg bg-zinc-950/30 border border-zinc-850/60 text-center">
                              <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
                              <span className="text-[9px] uppercase font-bold text-zinc-500 block tracking-wider">{label}</span>
                              <span className="text-sm font-black text-white">{value != null ? `${Math.round(value)}%` : "N/A"}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Captured Detections ({selectedSession.records.length})</h4>
                        {selectedSession.records.length === 0 ? (
                          <p className="text-xs text-zinc-500">No frame records captured in this session.</p>
                        ) : (
                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {selectedSession.records.map((rec, i) => {
                              const recEmo = (rec.dominant_emotion || "neutral").toLowerCase();
                              const emoji = EMOTION_EMOJIS[recEmo] || "😐";

                              return (
                                <div key={rec.id} className="flex justify-between items-center p-2.5 rounded bg-zinc-950/20 border border-zinc-850/60 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-500 font-semibold">#{i + 1}</span>
                                    <span className="text-white capitalize font-semibold">{emoji} {rec.dominant_emotion}</span>
                                  </div>
                                  <span className="text-primary font-bold">{Math.round(rec.confidence)}%</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 p-6">
                      <Eye className="h-8 w-8 mb-2 text-zinc-600 opacity-60" />
                      <span>No session selected. Click the inspection icon to review detailed snapshots.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalyticsDashboard;
