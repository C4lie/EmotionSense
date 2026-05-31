import { X, Award, Activity, Heart, Eye, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";

export const InterviewSessionReport = ({ session, onClose }) => {
  if (!session) return null;

  // Final badge classification based on confidence score
  const getPerformanceBadge = (score) => {
    if (score >= 80) return { label: "Elite Professional", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/35" };
    if (score >= 65) return { label: "Confident Candidate", color: "text-primary bg-primary/10 border-primary/30" };
    if (score >= 50) return { label: "Steady Presenter", color: "text-accent bg-accent/10 border-accent/30" };
    return { label: "Developing Presenter", color: "text-accent-danger bg-accent-danger/10 border-accent-danger/30" };
  };

  const badge = getPerformanceBadge(session.confidence_score || 50);

  // Fallback recommendations list if empty in backend
  const tips = session.recommendation_list && session.recommendation_list.length > 0
    ? session.recommendation_list.map(r => r.recommendation)
    : [
        "Project your expressions slightly more when starting your thoughts.",
        "Stabilize head movement to assert eye-contact stance.",
        "Take controlled breaths on longer question descriptions."
      ];

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 overflow-y-auto">
      <div className="bg-background/95 border border-border/60 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-elevated-lg relative my-8 backdrop-blur-3xl animate-in scale-in duration-300">
        {/* Glow border strip */}
        <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-accent to-accent-success" />
        
        {/* Ambient background blur inside the modal */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-surface border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all duration-250"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <Award className="h-3.5 w-3.5" /> Mock Analysis Report
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
              Interview Coach Report
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Coaching aggregates processed from visual feed and tone metrics.
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold tracking-tight shadow-sm ${badge.color}`}>
              <Sparkles className="h-4 w-4" /> {badge.label}
            </span>
          </div>
        </div>

        {/* Grid Statistics Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-surface/30 border-border/30 hover:border-border/60 transition-all">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider font-display">Confidence</span>
              <span className="text-2xl font-black text-foreground">{session.confidence_score || 50}%</span>
            </CardContent>
          </Card>

          <Card className="bg-surface/30 border-border/30 hover:border-border/60 transition-all">
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto text-accent-success mb-2" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider font-display">Eye Focus</span>
              <span className="text-2xl font-black text-foreground">{session.eye_contact_score || 50}%</span>
            </CardContent>
          </Card>

          <Card className="bg-surface/30 border-border/30 hover:border-border/60 transition-all">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto text-accent mb-2" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider font-display">Stability</span>
              <span className="text-2xl font-black text-foreground">{session.stability_score || 50}%</span>
            </CardContent>
          </Card>

          <Card className="bg-surface/30 border-border/30 hover:border-border/60 transition-all">
            <CardContent className="p-4 text-center">
              <Heart className="h-5 w-5 mx-auto text-accent-danger mb-2" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider font-display">Motion Energy</span>
              <span className="text-2xl font-black text-foreground">{session.speaking_energy || 50}%</span>
            </CardContent>
          </Card>
        </div>

        {/* Tips / Insights list */}
        <div className="bg-surface-elevated/40 p-4 rounded-xl border border-border/40 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5 border-b border-border/40 pb-2 font-display">
            <BookOpen className="h-4 w-4 text-primary" /> AI Interview Insights & Tips
          </h3>
          <ul className="space-y-3">
            {tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-foreground/80 leading-relaxed flex gap-2 items-start">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 border-t border-border/30 pt-6">
          <Button variant="primary" onClick={onClose} className="px-6 font-semibold">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSessionReport;
