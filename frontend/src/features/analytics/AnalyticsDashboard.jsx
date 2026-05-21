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
} from "lucide-react";

export const AnalyticsDashboard = () => {
  const [rangeDays, setRangeDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [sessionsData, setSessionsData] = useState({ sessions: [], total: 0 });
  const [page, setPage] = useState(1);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
    if (score >= 80) return { label: "Exceptional", color: "text-emerald-400" };
    if (score >= 60) return { label: "Good", color: "text-primary" };
    if (score >= 40) return { label: "Neutral", color: "text-yellow-400" };
    if (score >= 20) return { label: "Low", color: "text-amber-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const totalPages = Math.ceil(sessionsData.total / 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" /> Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review historical mood expressions, distribution parameters, and past logs.
          </p>
        </div>

        {/* Range Selectors */}
        <div className="flex bg-zinc-900/60 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setRangeDays(7)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              rangeDays === 7 ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRangeDays(30)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              rangeDays === 30 ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="h-96 flex items-center justify-center">
          <Loader size="lg" text="Compiling metrics..." />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Analytics Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mood Score */}
            <Card glow>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Positivity Score</span>
                  <Smile className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{analytics?.mood_score}%</span>
                  <span className={`text-xs font-bold ${getMoodRating(analytics?.mood_score || 0).color}`}>
                    {getMoodRating(analytics?.mood_score || 0).label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${analytics?.mood_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total Sessions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Total Sessions</span>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-white">{analytics?.total_sessions}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Active video/image runs in range.
                </p>
              </CardContent>
            </Card>

            {/* Total Detections */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Total Records</span>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-white">{analytics?.total_detections}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Granular face snapshots logged.
                </p>
              </CardContent>
            </Card>

            {/* Dominant Trend */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Dominant Trend</span>
                  <Smile className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-white capitalize">
                    {analytics?.most_frequent_emotion || "None"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Highest frequency classification.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Deck */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timeline Area (2/3 width) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Mood Progression
                </CardTitle>
                <CardDescription>Daily dominant emotion indices over the active timeframe.</CardDescription>
              </CardHeader>
              <CardContent>
                <MoodTimeline data={analytics?.mood_timeline} />
              </CardContent>
            </Card>

            {/* Radar Distribution (1/3 width) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Probability Weights
                </CardTitle>
                <CardDescription>Overall breakdown of the 7 basic expressions.</CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart distribution={analytics?.emotion_distribution} />
              </CardContent>
            </Card>
          </div>

          {/* Sessions & Modal Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left/Middle: Paginated log table (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Past Session Logs
              </h3>

              {isLoadingSessions ? (
                <div className="h-48 flex items-center justify-center bg-zinc-950/20 rounded-xl border border-white/5">
                  <Loader size="md" text="Loading logs..." />
                </div>
              ) : sessionsData.sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed border-white/5 rounded-xl bg-zinc-900/10">
                  <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No historical sessions recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-muted-foreground font-semibold bg-zinc-900/20">
                          <th className="p-4">Date/Time</th>
                          <th className="p-4">Dominant</th>
                          <th className="p-4">Confidence</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm text-foreground">
                        {sessionsData.sessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-zinc-900/20 transition-all">
                            <td className="p-4 font-medium text-white">{formatTime(sess.started_at)}</td>
                            <td className="p-4 capitalize">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                  sess.dominant_emotion === "happy"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : sess.dominant_emotion === "angry"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {sess.dominant_emotion || "guest run"}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-white">
                              {sess.average_confidence ? `${Math.round(sess.average_confidence)}%` : "N/A"}
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controller */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
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
              <Card className="h-full border-white/5 bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Session Inspector
                  </CardTitle>
                  <CardDescription>Click a session's eye icon to inspect granular frames.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] overflow-y-auto">
                  {isLoadingDetails ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader text="Fetching details..." size="md" />
                    </div>
                  ) : selectedSession ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/5 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Session ID</span>
                          <span className="font-mono text-white truncate max-w-[150px]">{selectedSession.id}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Started</span>
                          <span className="text-white">{formatTime(selectedSession.started_at)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Dominant</span>
                          <span className="text-white font-bold capitalize">{selectedSession.dominant_emotion}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Captured Detections ({selectedSession.records.length})</h4>
                        {selectedSession.records.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No frame records captured in this session.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedSession.records.map((rec, i) => (
                              <div key={rec.id} className="flex justify-between items-center p-2 rounded bg-black/20 border border-white/5 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Frame {i + 1}</span>
                                  <span className="ml-2 font-semibold text-white capitalize">{rec.dominant_emotion}</span>
                                </div>
                                <span className="text-primary font-bold">{Math.round(rec.confidence)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground border border-dashed border-white/5 rounded-lg bg-zinc-900/10 p-4">
                      No session selected. Click the inspection icon to review detailed snapshots.
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
