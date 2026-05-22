import React, { useState } from "react";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Crown,
  Check,
  Zap,
  Mic,
  BarChart3,
  Brain,
  Shield,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";

/**
 * PricingPage
 * Shows free vs premium plan comparison.
 * Phase 1: Activation is instant (no payment).
 * Phase 2: Connect to Stripe Checkout.
 */
const PricingPage = () => {
  const { isPremium, isLoading, activatePremium, cancelPremium } = useSubscriptionStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  const handleActivate = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await activatePremium();
      setFeedback({ type: "success", message: "Premium activated! Enjoy all features." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPremium();
      setFeedback({ type: "success", message: "Subscription cancelled. You have been moved to the free plan." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const freeFeatures = [
    "Live facial emotion detection",
    "Basic session history (last 10)",
    "Emotion analytics dashboard",
    "Public Speaking Trainer (face only)",
  ];

  const premiumFeatures = [
    "Everything in Free",
    "AI Tone & Voice Coaching",
    "Real-time audio energy analysis",
    "Hesitation & pace detection",
    "Expressiveness scoring",
    "Personalized coaching recommendations",
    "Unlimited coaching report history",
    "Priority analysis engine",
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl relative min-h-screen">
      {/* Glow background */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <div className="relative z-10 text-center mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Crown className="h-3.5 w-3.5" /> Premium Plans
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
          Unlock Your Full Communication Potential
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-base">
          EmotionSense AI Premium gives you real-time voice coaching, tone analysis, and AI-powered
          recommendations to become a more confident, compelling speaker.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`relative z-10 flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-8 border text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="hover:opacity-70 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="relative z-10 grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-zinc-800/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-zinc-400" /> Free
              </CardTitle>
              {!isPremium && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Current Plan
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-zinc-500 text-sm ml-1">/ forever</span>
            </div>
            <CardDescription className="mt-1">Everything you need to get started.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {freeFeatures.map((feat) => (
              <div key={feat} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                {feat}
              </div>
            ))}
            <div className="pt-4">
              <Button
                variant="secondary"
                className="w-full"
                disabled={true}
              >
                {isPremium ? "Downgrade (see cancel below)" : "Your current plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-amber-500/30 bg-zinc-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.08)] relative overflow-visible">
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-black text-black uppercase tracking-wider shadow-lg">
            Recommended
          </div>

          <CardHeader className="pb-4 border-b border-amber-500/15">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" /> Premium
              </CardTitle>
              {isPremium && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Active
                </span>
              )}
            </div>
            <div className="mt-3">
              <span className="text-4xl font-black text-white">Free</span>
              <span className="text-zinc-500 text-sm ml-2">(Phase 1 — Beta access)</span>
            </div>
            <CardDescription className="mt-1 text-amber-300/60">
              Full AI coaching suite. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {premiumFeatures.map((feat) => (
              <div key={feat} className="flex items-start gap-2.5 text-sm text-zinc-200">
                <Check className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                {feat}
              </div>
            ))}

            <div className="pt-4 space-y-2">
              {!isPremium ? (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-lg shadow-amber-500/20 border-none"
                  onClick={handleActivate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Activate Premium — Free</>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold border-none"
                    onClick={() => navigate("/tone-coach")}
                  >
                    <Mic className="h-4 w-4" /> Open Tone Coach
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-zinc-500 hover:text-red-400 text-xs"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel subscription
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature highlights */}
      <div className="relative z-10 mt-16 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: <Mic className="h-6 w-6 text-indigo-400" />,
            title: "Voice Tone Analysis",
            desc: "Measures energy, pace, hesitation, and expressiveness in real-time using the browser's Web Audio API.",
          },
          {
            icon: <Brain className="h-6 w-6 text-purple-400" />,
            title: "AI Coaching Engine",
            desc: "Combines vocal telemetry with facial emotion data to generate personalised, actionable recommendations.",
          },
          {
            icon: <BarChart3 className="h-6 w-6 text-emerald-400" />,
            title: "Progress Tracking",
            desc: "Every coaching session is stored. Track your improvement across confidence, delivery, and tone over time.",
          },
        ].map(({ icon, title, desc }) => (
          <Card key={title} className="border-zinc-800 bg-zinc-900/30 p-6">
            <div className="mb-3">{icon}</div>
            <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
