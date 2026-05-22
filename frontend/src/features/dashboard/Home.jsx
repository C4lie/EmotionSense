import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ArrowRight, BarChart3, Activity, ShieldCheck, Heart, Zap, Sparkles } from "lucide-react";
import heroBg from "../../assets/hero_background.png";
import logoImg from "../../assets/emotionsense_logo.png";

export const Home = () => {
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Hero Section with Photo Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-8 pb-16 px-4">
        {/* Background Image Container with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Facial Emotion Detection Tech Background"
            className="w-full h-full object-cover object-center opacity-45"
          />
          {/* Gradients to blend background cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-zinc-950/90" />
          {/* Subtle colored glow blobs */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Animated Glowing Logo */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-purple-600 blur opacity-45 group-hover:opacity-75 transition duration-500" />
            <div className="relative h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center p-1.5 shadow-2xl">
              <img
                src={logoImg}
                alt="EmotionSense AI Logo"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
          </div>

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Expression Analytics
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Emotion<span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Sense</span> AI
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            An advanced real-time expression detection platform. Harness deep learning neural networks to decode human emotions instantly, analyze expressions on the fly, and unlock rich mood metrics.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 text-base font-semibold group shadow-lg hover:shadow-primary/20">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/analytics" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full gap-2 text-base font-semibold border-zinc-800 hover:bg-zinc-900/50">
                <BarChart3 className="h-4.5 w-4.5" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Scrolling / Feature Section: Why This Is Made */}
      <section className="relative py-24 px-4 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why EmotionSense AI?
            </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto" />
          </div>

          {/* Main Statement/Quote */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-xl md:text-2xl font-medium text-zinc-200 leading-relaxed italic">
              "This platform is designed to make your confidence and emotional level more than others."
            </p>
            <p className="text-zinc-400 mt-4 text-sm uppercase tracking-wider font-semibold">
              The Mission
            </p>
          </div>

          {/* Key Value Pillars */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card glow className="bg-zinc-950/30 border-white/[0.06]">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Elevated Confidence</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Understand your baseline facial micro-expressions. Gain a structured view of your non-verbal cues to speak, present, and interact with unparalleled poise.
                </p>
              </CardContent>
            </Card>

            <Card glow className="bg-zinc-950/30 border-white/[0.06]">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Emotional Intelligence</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Bridge the gap between raw emotions and active awareness. Tracking your emotional distribution builds high EQ, enabling healthier communication and relationships.
                </p>
              </CardContent>
            </Card>

            <Card glow className="bg-zinc-950/30 border-white/[0.06]">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 text-green-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Personal Mastery</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  By reviewing daily metrics and session histories, you develop absolute control over how you project your emotions, putting you steps ahead in any social or business dynamic.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-900 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} EmotionSense AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
