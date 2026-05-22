import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  X,
  Crown,
  TrendingUp,
  Mic,
  Activity,
  ChevronRight,
  Star,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

/**
 * ToneCoachReport
 * Modal-style component that renders a full AI tone coaching report.
 *
 * Props:
 *   report  — coaching report object from the API (or useToneAnalysisStore)
 *   onClose — callback to dismiss the report
 */
const ToneCoachReport = ({ report, onClose }) => {
  if (!report) return null;

  const scoreColor = (score) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-indigo-400";
    return "text-rose-400";
  };

  const barColor = (score) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-indigo-500";
    return "bg-rose-500";
  };

  const scoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  const scores = [
    { label: "Overall", value: report.overall_score },
    { label: "Tone", value: report.tone_score },
    { label: "Delivery", value: report.delivery_score },
    { label: "Confidence", value: report.confidence_score },
    { label: "Energy", value: report.energy_score },
    { label: "Pace", value: report.pace_score },
    { label: "Hesitation", value: report.hesitation_score },
    { label: "Consistency", value: report.consistency_score },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/20 bg-zinc-950 shadow-[0_0_60px_rgba(245,158,11,0.1)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">AI Tone Coaching Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            aria-label="Close report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall score hero */}
          <div className="text-center py-4 px-6 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Overall Performance Score
            </p>
            <div className={`text-7xl font-black mb-1 ${scoreColor(report.overall_score)}`}>
              {report.overall_score}
            </div>
            <div
              className={`text-sm font-bold px-3 py-0.5 rounded-full inline-block ${
                report.overall_score >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : report.overall_score >= 60
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {scoreLabel(report.overall_score)}
            </div>
          </div>

          {/* Score breakdown grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" /> Score Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {scores.map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-400">{label}</span>
                    <span className={`text-sm font-black ${scoreColor(value ?? 0)}`}>
                      {value != null ? Math.round(value) : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor(value ?? 0)}`}
                      style={{ width: `${Math.min(100, value ?? 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          {report.strengths && report.strengths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-400" /> Your Strengths
              </h3>
              <div className="space-y-2">
                {report.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-zinc-300 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement areas */}
          {report.improvement_areas && report.improvement_areas.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Areas to Improve
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.improvement_areas.map((area, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> AI Coaching Recommendations
              </h3>
              <div className="space-y-2.5">
                {report.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-zinc-300 leading-relaxed"
                  >
                    <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <Button variant="secondary" className="w-full" onClick={onClose}>
              Close Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToneCoachReport;
