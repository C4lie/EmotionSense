import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Flame, Trophy, Calendar, Sparkles, Snowflake, CheckCircle } from "lucide-react";
import { challengeService } from "../../services/challengeService";
import { streakService } from "../../services/streakService";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { cn } from "../../utils/cn";

export const DailyStreakCard = ({ onStartChallenge }) => {
  const { isAuthenticated } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const challengeData = await challengeService.getTodayChallenge();
      const streakData = await streakService.getStatus();
      setChallenge(challengeData);
      setStreak(streakData);
    } catch (err) {
      console.error("Failed to load daily challenges/streaks", err);
      setError("Failed to sync metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleUseFreeze = async () => {
    try {
      await streakService.freezeStreak();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to apply freeze");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Card className="border-border/50 bg-surface/20 backdrop-blur-xl shadow-elevated mb-6">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-base flex items-center justify-between text-foreground font-display">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Daily Focus & Streaks
          </span>
          {streak && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 font-bold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5 fill-orange-400 animate-pulse" /> {streak.current_streak} Days
            </span>
          )}
        </CardTitle>
        <CardDescription>Practice daily to compound your speaking capability.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Syncing streak credentials...</div>
        ) : error ? (
          <div className="py-2 text-center text-xs text-accent-danger">{error}</div>
        ) : (
          <>
            {/* Daily Challenge Section */}
            {challenge && (
              <div className={cn(
                "p-3.5 rounded-xl border transition-all duration-300",
                challenge.completed 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-primary/5 border-primary/20 text-primary"
              )}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-display">Today's Daily Target</span>
                    <span className="text-sm font-extrabold text-foreground flex items-center gap-1.5 font-display">
                      <Sparkles className="h-4 w-4" /> {challenge.title}
                    </span>
                  </div>
                  {challenge.completed ? (
                    <span className="text-xs flex items-center gap-1 font-bold text-emerald-400 font-display">
                      <CheckCircle className="h-4 w-4 fill-emerald-500/25" /> Completed
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-primary/30 font-bold bg-primary/10 capitalize">
                      {challenge.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {challenge.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-2 font-mono">
                  <span>Target Confidence: {Math.round(challenge.target_score)}%</span>
                  {!challenge.completed && onStartChallenge && (
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => onStartChallenge(challenge)}
                      className="h-7 text-[10px] font-bold px-3 py-1 shadow-glow-sm"
                    >
                      Start Challenge
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Streak Metrics Section */}
            {streak && (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-background/25 p-2.5 rounded-lg border border-border/40">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block font-display">Longest Streak</span>
                  <span className="text-lg font-black text-foreground font-mono">{streak.longest_streak} Days</span>
                </div>
                <div className="bg-background/25 p-2.5 rounded-lg border border-border/40 flex flex-col justify-center items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block font-display">Streak Status</span>
                  {streak.practiced_today ? (
                    <span className="text-xs font-extrabold text-emerald-400 font-display mt-0.5">Practiced Today!</span>
                  ) : (
                    <span className="text-xs font-extrabold text-accent-warning font-display mt-0.5">Awaiting Practice</span>
                  )}
                </div>
              </div>
            )}

            {/* Streak Freeze for Premium Users */}
            {isPremium && streak && !streak.practiced_today && (
              <Button 
                onClick={handleUseFreeze} 
                variant="outline" 
                size="sm" 
                className="w-full gap-1.5 border-blue-500/25 hover:bg-blue-500/10 text-blue-400 text-xs font-bold"
              >
                <Snowflake className="h-4 w-4" /> Use Streak Freeze
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
