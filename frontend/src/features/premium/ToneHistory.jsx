import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { toneService } from "../../services/toneService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import ToneCoachReport from "../../components/ToneCoachReport";
import {
  Mic,
  Crown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  Activity,
  Award,
  Zap,
  Clock,
  Volume2,
  Timer,
  AlertTriangle,
} from "lucide-react";

/**
 * ToneHistory
 * Premium feature page that lists the history of past AI tone coaching sessions.
 */
const ToneHistory = () => {
  const navigate = useNavigate();
  const { isPremium, isLoading: subLoading } = useSubscriptionStore();
  const [historyData, setHistoryData] = useState({ reports: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await toneService.getHistory(page, pageSize);
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to load tone coaching history:", err);
      setError(err.response?.data?.detail || "Failed to load history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium) {
      fetchHistory();
    }
  }, [page, isPremium]);

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
            AI Tone Coaching History requires an active premium subscription. Upgrade now to track your voice coaching improvements over time.
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 50) return "text-indigo-400 border-indigo-500/20 bg-indigo-500/5";
    return "text-rose-400 border-rose-500/20 bg-rose-500/5";
  };

  const totalPages = Math.ceil(historyData.total / pageSize) || 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative min-h-screen">
      {/* Glow overlays */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Page header */}
      <div className="relative z-10 mb-8 border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Crown className="h-3 w-3" /> Premium Feature
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Mic className="h-8 w-8 text-amber-400" /> Tone Coaching History
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review your past AI vocal evaluations and recommendations to gauge your progression.
          </p>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate("/tone-coach")} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to Coach
          </Button>
        </div>
      </div>

      {/* Content Body */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader size="lg" text="Loading historical reports..." />
          </div>
        ) : error ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
            <p className="text-zinc-300 font-semibold mb-2">Error Loading History</p>
            <p className="text-zinc-500 text-sm mb-4">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchHistory}>
              Try Again
            </Button>
          </div>
        ) : historyData.reports.length === 0 ? (
          <Card className="glass border-zinc-850 bg-zinc-900/20 backdrop-blur-xl p-12 text-center shadow-lg">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-bold text-white">No Coaching History Yet</h2>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                You haven't run any AI tone coaching sessions yet. Start your first session to analyze your energy, pace, and delivery.
              </p>
              <div className="pt-2">
                <Button onClick={() => navigate("/tone-coach")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  Start First Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Grid of Report Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyData.reports.map((report) => (
                <Card
                  key={report.id}
                  className="glass border-zinc-850 bg-zinc-900/30 backdrop-blur-xl hover:border-amber-500/35 transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-zinc-900/40">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          Session
                        </span>
                        <CardTitle className="text-xs text-zinc-300 font-semibold leading-tight">
                          {formatDate(report.created_at)}
                        </CardTitle>
                      </div>
                      <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center border font-black text-lg ${getScoreColor(report.overall_score || 0)}`}>
                        {Math.round(report.overall_score || 0)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 flex-1 flex flex-col justify-between">
                    {/* Small breakdown of key metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Volume2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>Energy: <span className="font-semibold text-zinc-200">{Math.round(report.energy_score || 0)}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Timer className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Pace: <span className="font-semibold text-zinc-200">{Math.round(report.pace_score || 0)}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Activity className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Fluency: <span className="font-semibold text-zinc-200">{Math.round(100 - (report.hesitation_score || 0) * 100)}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        <span>Confidence: <span className="font-semibold text-zinc-200">{Math.round(report.confidence_score || 0)}%</span></span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-semibold"
                      onClick={() => setSelectedReport(report)}
                    >
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-900 pt-6">
                <span className="text-xs text-zinc-500 font-semibold">
                  Page {page} of {totalPages} ({historyData.total} total sessions)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="gap-1"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details report popup */}
      {selectedReport && (
        <ToneCoachReport report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
};

export default ToneHistory;
