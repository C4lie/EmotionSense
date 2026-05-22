import React from "react";
import { X, Award, Activity, Heart, Eye, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";

export const TrainerSessionReport = ({ session, capturedRecords, onClose }) => {
  if (!session) return null;

  // Final badge classification based on confidence score
  const getPerformanceBadge = (score) => {
    if (score >= 80) return { label: "Elite Orator", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (score >= 65) return { label: "Confident Speaker", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    if (score >= 50) return { label: "Steady Presenter", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    return { label: "Developing Presenter", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const badge = getPerformanceBadge(session.confidence_score || 50);

  // Formatting chart timeline data from frame-level captured records
  const chartData = capturedRecords.map((r, idx) => ({
    frame: idx + 1,
    Confidence: Math.round(r.confidence),
    Happy: Math.round(r.happy),
    Neutral: Math.round(r.neutral),
    Focus: r.box_x > 0 ? 100 : 0, // simple trace indicator
  }));

  // Consolidating feedback tips
  const getFeedbackInsights = (s) => {
    const tips = [];
    if ((s.eye_contact_score || 50) < 65) {
      tips.push("Your eye-contact focus dropped. Try to glance less at keyboard/notes and look into the camera lens.");
    }
    if ((s.speaking_energy || 50) < 40) {
      tips.push("Your energy index was low. Project your voice louder and express emotion to avoid sounding monotone.");
    }
    if ((s.stability_score || 50) < 50) {
      tips.push("High volatility detected. Try speaking in longer, complete thoughts to stabilize your emotional spikes.");
    }
    if ((s.confidence_score || 50) > 75) {
      tips.push("Superb expression control! You maintained balanced neutral composure mixed with positive happy indicators.");
    } else {
      tips.push("Affirm your posture: sitting up straight, breathing into your diaphragm, and smiling slightly can boost confidence score.");
    }
    return tips;
  };

  const tips = getFeedbackInsights(session);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 overflow-y-auto">
      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative my-8 backdrop-blur-3xl animate-in fade-in duration-300">
        {/* Glow border strip */}
        <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
        
        {/* Ambient background blur inside the modal */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-muted-foreground hover:text-white hover:border-zinc-700 transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Award className="h-3.5 w-3.5" /> Session Telemetry Summary
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Speaking Practice Report
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Final analytical parameters recorded and committed to database history.
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold tracking-tight shadow-sm ${badge.color}`}>
              <Sparkles className="h-4 w-4" /> {badge.label}
            </span>
          </div>
        </div>

        {/* Grid Statistics Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 transition-all">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-blue-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Confidence</span>
              <span className="text-2xl font-black text-white">{session.confidence_score}%</span>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 transition-all">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto text-purple-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Stability</span>
              <span className="text-2xl font-black text-white">{session.stability_score}%</span>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 transition-all">
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto text-emerald-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Eye Focus</span>
              <span className="text-2xl font-black text-white">{session.eye_contact_score}%</span>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 transition-all">
            <CardContent className="p-4 text-center">
              <Heart className="h-5 w-5 mx-auto text-rose-400 mb-2" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Energy Index</span>
              <span className="text-2xl font-black text-white">{session.speaking_energy}%</span>
            </CardContent>
          </Card>
        </div>

        {/* Mid-content Layout Split */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Timeline chart (3/5) */}
          <div className="lg:col-span-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Activity className="h-4 w-4 text-primary" /> Live Expression Timeline
            </h3>
            <div className="w-full h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f22" />
                    <XAxis dataKey="frame" stroke="#52525b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "11px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                    <Line
                      type="monotone"
                      dataKey="Confidence"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line type="monotone" dataKey="Happy" stroke="#10b981" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Neutral" stroke="#71717a" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  No chart points generated.
                </div>
              )}
            </div>
          </div>

          {/* Tips / Insights list (2/5) */}
          <div className="lg:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3.5 flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                <BookOpen className="h-4 w-4 text-primary" /> Behavioral Insights
              </h3>
              <ul className="space-y-3">
                {tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-zinc-300 leading-relaxed flex gap-2 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {session.script_text && (
              <div className="mt-4 pt-3 border-t border-zinc-900">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block tracking-wider mb-1">Target Script Used</span>
                <p className="text-[11px] text-zinc-400 italic line-clamp-2">
                  "{session.script_text}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 border-t border-zinc-900 pt-6">
          <Button variant="primary" onClick={onClose} className="px-6 font-semibold">
            Close & Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
