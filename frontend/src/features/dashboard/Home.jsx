import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Activity,
  ShieldCheck,
  Heart,
  Zap,
  Sparkles,
  UserPlus,
  Video,
  BookOpen,
  Target,
  MessageSquare,
} from "lucide-react";
import heroBg from "../../assets/hero_background.png";
import logoImg from "../../assets/emotionsense_logo.png";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { GlassCard } from "../../components/ui/GlassCard";
import { AnimatedPage } from "../../components/ui/AnimatedPage";
import { fadeInUp, staggerContainer } from "../../utils/animations";

export const Home = () => {
  return (
    <AnimatedPage>
      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* ─── Hero Section with Visual Backdrop ─── */}
        <section className="relative min-h-[95vh] flex items-center justify-center pt-12 pb-20 px-4 md:px-8">
          {/* Background Image Container with Premium Gradient Overlays */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroBg}
              alt="Premium Communication Coach Background"
              className="w-full h-full object-cover object-center opacity-30 select-none pointer-events-none"
            />
            {/* Soft, blended dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-transparent to-background/95" />
            
            {/* Ambient colorful glow blobs for premium feel */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Animated Logo Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "out-expo" }}
              className="relative mb-6 group cursor-pointer"
            >
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-primary to-accent/60 blur opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative h-20 w-20 rounded-full bg-surface-elevated border border-border/80 flex items-center justify-center p-1.5 shadow-elevated">
                <img
                  src={logoImg}
                  alt="EmotionSense AI V3 Logo"
                  className="h-full w-full object-contain rounded-full select-none"
                />
              </div>
            </motion.div>

            {/* Product Identity Tagline */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Communication & Confidence Coach
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="text-fluid-4xl md:text-fluid-hero font-extrabold tracking-tight mb-6 font-display"
            >
              Master Your Speaking.<br />
              <span className="text-gradient-primary">Build Unshakable Confidence.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed mb-10"
            >
              EmotionSense AI is your personal communication assistant. Leverage advanced real-time audio-visual feedback to polish your pacing, manage pause structures, maintain strong delivery, and unlock your public speaking potential.
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md"
            >
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 text-base font-semibold group shadow-glow-md">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full gap-2 text-base font-semibold border-border/80 hover:bg-surface/50">
                  <Zap className="h-4 w-4 text-amber-400" />
                  View Premium Plans
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Storytelling & Purpose Section ─── */}
        <section className="relative py-24 px-4 bg-surface/30 border-t border-border/40">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-fluid-3xl font-bold tracking-tight mb-4 font-display">
                Communication is a Trainable Skill
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
            </div>

            {/* Narrative quote */}
            <div className="max-w-3xl mx-auto text-center mb-16">
              <blockquote className="text-fluid-lg md:text-fluid-xl font-medium text-foreground/90 leading-relaxed italic">
                "Our mission is to help you build absolute control over how you speak, present, and project your ideas, turning speaking anxiety into a powerful professional advantage."
              </blockquote>
              <p className="text-muted-foreground mt-4 text-xs uppercase tracking-widest font-semibold">
                — EmotionSense V3 Core Mandate
              </p>
            </div>

            {/* Key Pillars Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-3 gap-8"
            >
              <Card className="bg-surface-elevated/40 border-border/50 hover:shadow-glow-sm transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-fluid-lg font-bold mb-2 font-display">Vocal Confidence</h3>
                  <p className="text-fluid-sm text-muted-foreground leading-relaxed">
                    Understand your speaking pace, pitch levels, and pause intervals. Eliminate distracting hesitation sounds and filler words to speak with authority.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-surface-elevated/40 border-border/50 hover:shadow-glow-sm transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 text-accent">
                    <Heart className="h-5 w-5" />
                  </div>
                  <h3 className="text-fluid-lg font-bold mb-2 font-display">Emotional Consistency</h3>
                  <p className="text-fluid-sm text-muted-foreground leading-relaxed">
                    Bridge the gap between your physical expression and inner confidence. Learn to project natural positive emotions and maintain a relaxed, engaging presence.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-surface-elevated/40 border-border/50 hover:shadow-glow-sm transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-accent-success/10 border border-accent-success/20 flex items-center justify-center mb-4 text-accent-success">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-fluid-lg font-bold mb-2 font-display">Active Improvement</h3>
                  <p className="text-fluid-sm text-muted-foreground leading-relaxed">
                    Track your growth streaks, tackle custom speaking challenges, and review detailed session timelines. Watch your personal confidence index grow week over week.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* ─── Interactive Feature Showcase ─── */}
        <section className="relative py-24 px-4 bg-background border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-fluid-3xl md:text-fluid-4xl font-extrabold tracking-tight mb-4 font-display">
                The Coach's Toolkit
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-fluid-sm">
                Unlock specialized, interactive workspaces designed to evaluate every layer of your presentation skills.
              </p>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Feature 1: Live Expression Dashboard */}
              <GlassCard tilt className="flex flex-col justify-between h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Video className="h-5 w-5" />
                      </div>
                      <h3 className="text-fluid-xl font-bold font-display">1. Interactive Feedback Studio</h3>
                    </div>
                    <p className="text-fluid-sm text-muted-foreground mb-6 leading-relaxed">
                      <strong>Purpose:</strong> Instant posture, eye-contact, and visual presence tracking. See how micro-expressions align with your confidence goals to project stability.
                    </p>
                    
                    {/* Visual mockup container */}
                    <div className="bg-background/80 border border-border/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex items-center justify-center">
                      {/* Bounding box outline */}
                      <div className="relative border border-primary/40 rounded-lg p-2 flex flex-col items-center bg-surface/50 w-44 h-32 justify-center">
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />
                        
                        <div className="text-3xl">😊</div>
                        <div className="text-[10px] font-mono text-primary mt-2 uppercase tracking-widest font-bold">Stable Eye Contact</div>
                        <div className="bg-primary/20 border border-primary/30 rounded px-1.5 py-0.5 mt-1 text-[8px] text-primary font-bold">
                          CONFIDENT 94.6%
                        </div>
                      </div>
                      
                      {/* Live charts preview */}
                      <div className="ml-4 flex flex-col gap-2 w-32">
                        <div className="h-2 w-full bg-surface-elevated rounded overflow-hidden">
                          <div className="h-full bg-primary rounded" style={{ width: '94%' }}></div>
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Stability (94%)</span>
                        <div className="h-2 w-full bg-surface-elevated rounded overflow-hidden">
                          <div className="h-full bg-accent rounded" style={{ width: '6%' }}></div>
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Tension (6%)</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/dashboard" className="block mt-auto">
                    <Button variant="outline" className="w-full text-xs gap-1 hover:bg-primary/10">
                      Open Feedback Studio <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>

              {/* Feature 2: Speaking Teleprompter Trainer */}
              <GlassCard tilt className="flex flex-col justify-between h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h3 className="text-fluid-xl font-bold font-display">2. Confidence Builder</h3>
                    </div>
                    <p className="text-fluid-sm text-muted-foreground mb-6 leading-relaxed">
                      <strong>Purpose:</strong> Guided presentation practice. Speak with a scrolling auto-teleprompter, capture vocal parameters, and review visual reports of your speaking runs.
                    </p>

                    {/* Teleprompter Mockup */}
                    <div className="bg-background/80 border border-border/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1 flex justify-between">
                        <span>Confidence teleprompter</span>
                        <span className="text-accent animate-pulse font-bold">● REC</span>
                      </div>
                      
                      <div className="my-2 text-center text-xs text-foreground/80 font-medium select-none overflow-hidden h-14 relative flex flex-col justify-center">
                        <div className="text-[9px] text-muted-foreground/50 line-through">Welcome to my speaking presentation.</div>
                        <div className="text-accent font-bold border-y border-accent/20 py-0.5 bg-accent/5">In public speaking, pacing is everything...</div>
                        <div className="text-[9px] text-muted-foreground">taking pauses allows your audience to absorb ideas...</div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                        <span>Pace: 135 words/min</span>
                        <span className="bg-accent/10 border border-accent/20 px-1 rounded text-accent">Rhythm: Perfect</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/speaking-trainer" className="block mt-auto">
                    <Button variant="outline" className="w-full text-xs gap-1 hover:bg-accent/10">
                      Open Confidence Builder <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>

              {/* Feature 3: Vocal & Tone Analysis (Premium) */}
              <GlassCard tilt className="flex flex-col justify-between h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="text-fluid-xl font-bold font-display">3. AI Tone Coach</h3>
                    </div>
                    <p className="text-fluid-sm text-muted-foreground mb-6 leading-relaxed">
                      <strong>Purpose:</strong> Advanced speech-rate and vocal volume analytics. Deep-dive into energy tracking and pauses to ensure a commanding, engaging voice.
                    </p>

                    {/* Audio analysis mockup */}
                    <div className="bg-background/80 border border-border/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1 flex justify-between">
                        <span>Energy Spectrogram</span>
                        <span className="text-amber-400 font-bold">Premium</span>
                      </div>
                      
                      <div className="flex items-end justify-center gap-1.5 h-16 my-2">
                        <div className="w-2.5 bg-muted rounded-t h-4"></div>
                        <div className="w-2.5 bg-muted rounded-t h-8"></div>
                        <div className="w-2.5 bg-muted rounded-t h-6"></div>
                        <div className="w-2.5 bg-amber-500/40 rounded-t h-12"></div>
                        <div className="w-2.5 bg-amber-500/70 rounded-t h-14"></div>
                        <div className="w-2.5 bg-amber-500/30 rounded-t h-8"></div>
                        <div className="w-2.5 bg-muted rounded-t h-10"></div>
                        <div className="w-2.5 bg-muted rounded-t h-5"></div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                        <span>Vocal Resonance: Excellent</span>
                        <span className="text-amber-400">Energy Level: High</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/tone-coach" className="block mt-auto">
                    <Button variant="outline" className="w-full text-xs gap-1 hover:bg-amber-500/10">
                      Open Tone Coach <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>

              {/* Feature 4: Comprehensive Progress Logs */}
              <GlassCard tilt className="flex flex-col justify-between h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-accent-success/10 border border-accent-success/20 flex items-center justify-center text-accent-success">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <h3 className="text-fluid-xl font-bold font-display">4. Performance Analytics</h3>
                    </div>
                    <p className="text-fluid-sm text-muted-foreground mb-6 leading-relaxed">
                      <strong>Purpose:</strong> Track trends in communication effectiveness, session records, stability parameters, and long-term milestones to view clear trends.
                    </p>

                    {/* Progress curve mockup */}
                    <div className="bg-background/80 border border-border/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">
                        Confidence Growth Log
                      </div>
                      
                      <div className="h-20 w-full relative mt-2">
                        <svg className="w-full h-full text-primary" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M 0 32 L 20 25 L 40 28 L 60 18 L 80 12 L 100 6" />
                          <circle cx="20" cy="25" r="2" fill="currentColor" />
                          <circle cx="40" cy="28" r="2" fill="currentColor" />
                          <circle cx="60" cy="18" r="2" fill="currentColor" />
                          <circle cx="80" cy="12" r="2" fill="currentColor" />
                          <circle cx="100" cy="6" r="2" fill="currentColor" />
                          <path d="M 0 32 L 20 25 L 40 28 L 60 18 L 80 12 L 100 6 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.05" stroke="none" />
                        </svg>
                        <div className="absolute top-2 left-2 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[8px] text-primary font-bold">
                          +18.2% Skill Lift
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-[8px] text-muted-foreground uppercase font-bold px-1">
                        <span>Wk 1</span>
                        <span>Wk 2</span>
                        <span>Wk 3</span>
                        <span>Wk 4</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/analytics" className="block mt-auto">
                    <Button variant="outline" className="w-full text-xs gap-1 hover:bg-accent-success/10">
                      Open Performance Analytics <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>

            </div>
          </div>
        </section>

        {/* ─── Interactive Roadmap / Progress Steps ─── */}
        <section className="relative py-24 px-4 bg-surface/30 border-t border-border/40 overflow-hidden">
          {/* Ambient light flares */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Core Flow
              </div>
              <h2 className="text-fluid-3xl md:text-fluid-4xl font-extrabold tracking-tight mb-4 font-display">
                Four Steps to Eloquent Speaking
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-fluid-sm">
                Get started instantly with our micro-feedback loop and interactive coaches.
              </p>
            </div>

            {/* Stepper Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -top-6 -left-3 text-7xl font-black text-foreground/5 select-none transition-all group-hover:text-primary/10">01</div>
                <Card className="bg-surface-elevated/20 border-border/60 backdrop-blur-md hover:border-primary/40 transition-all duration-300 relative overflow-hidden h-full">
                  <CardContent className="pt-8 pb-6">
                    <svg className="absolute -right-4 -bottom-4 w-20 h-20 text-muted-foreground/5 pointer-events-none group-hover:text-primary/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="50" cy="50" r="30" strokeDasharray="5 5" />
                      <path d="M20 20 L80 80 M80 20 L20 80" />
                    </svg>
                    
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <h3 className="text-fluid-lg font-bold mb-2 font-display">Create Private Space</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Register to secure your profile. Track historical records and custom milestones safely.
                    </p>
                  </CardContent>
                </Card>
                {/* Connector Arrow (Desktop) */}
                <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-10 h-8 z-20 pointer-events-none text-border/60 group-hover:text-primary/45 transition-colors duration-300">
                  <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12 C 12 4, 36 20, 44 12" strokeDasharray="4 4" />
                    <path d="M38 6 L44 12 L38 18" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -top-6 -left-3 text-7xl font-black text-foreground/5 select-none transition-all group-hover:text-accent/10">02</div>
                <Card className="bg-surface-elevated/20 border-border/60 backdrop-blur-md hover:border-accent/40 transition-all duration-300 relative overflow-hidden h-full">
                  <CardContent className="pt-8 pb-6">
                    <svg className="absolute -right-4 -bottom-4 w-20 h-20 text-muted-foreground/5 pointer-events-none group-hover:text-accent/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 50 C 30 20, 70 80, 90 50" strokeDasharray="3 3" />
                      <circle cx="90" cy="50" r="4" fill="currentColor" />
                    </svg>
                    
                    <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform duration-300">
                      <Video className="h-6 w-6" />
                    </div>
                    <h3 className="text-fluid-lg font-bold mb-2 font-display">Configure Session</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select your target duration. Pick from structured training scripts or customize your own speaking prompts.
                    </p>
                  </CardContent>
                </Card>
                {/* Connector Arrow (Desktop) */}
                <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-10 h-8 z-20 pointer-events-none text-border/60 group-hover:text-accent/45 transition-colors duration-300">
                  <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12 C 12 20, 36 4, 44 12" strokeDasharray="4 4" />
                    <path d="M38 6 L44 12 L38 18" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -top-6 -left-3 text-7xl font-black text-foreground/5 select-none transition-all group-hover:text-amber-400/10">03</div>
                <Card className="bg-surface-elevated/20 border-border/60 backdrop-blur-md hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden h-full">
                  <CardContent className="pt-8 pb-6">
                    <svg className="absolute -right-4 -bottom-4 w-20 h-20 text-muted-foreground/5 pointer-events-none group-hover:text-amber-500/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="25" y="25" width="50" height="50" rx="5" strokeDasharray="4 4" />
                      <path d="M40 50 L60 50 M50 40 L50 60" />
                    </svg>
                    
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-fluid-lg font-bold mb-2 font-display">Speak & Track</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Practice speaking using the camera and microphone. Receive contextual alerts to hold stable pace and keep eye contact.
                    </p>
                  </CardContent>
                </Card>
                {/* Connector Arrow (Desktop) */}
                <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-10 h-8 z-20 pointer-events-none text-border/60 group-hover:text-amber-500/45 transition-colors duration-300">
                  <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12 C 12 4, 36 20, 44 12" strokeDasharray="4 4" />
                    <path d="M38 6 L44 12 L38 18" />
                  </svg>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="absolute -top-6 -left-3 text-7xl font-black text-foreground/5 select-none transition-all group-hover:text-accent-success/10">04</div>
                <Card className="bg-surface-elevated/20 border-border/60 backdrop-blur-md hover:border-accent-success/40 transition-all duration-300 relative overflow-hidden h-full">
                  <CardContent className="pt-8 pb-6">
                    <svg className="absolute -right-4 -bottom-4 w-20 h-20 text-muted-foreground/5 pointer-events-none group-hover:text-accent-success/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="50" cy="50" r="10" />
                      <circle cx="50" cy="50" r="25" />
                      <path d="M50 10 L50 25 M50 75 L50 90 M10 50 L25 50 M75 50 L90 50" />
                    </svg>
                    
                    <div className="h-12 w-12 rounded-xl bg-accent-success/10 border border-accent-success/20 flex items-center justify-center mb-6 text-accent-success group-hover:scale-110 transition-transform duration-300">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-fluid-lg font-bold mb-2 font-display">Evaluate Progress</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Analyze detailed reports. Use data-driven insights and practice streaks to grow your skills day by day.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick dashboard launch panel */}
            <div className="mt-16 p-8 rounded-2xl border border-border/40 bg-surface/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black shadow-elevated">
                  🚀
                </div>
                <div>
                  <h4 className="text-fluid-lg font-bold font-display">Ready to speak with unshakable confidence?</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Explore our teleprompter workspaces, visual coaching aids, and vocal analytics to build habits.</p>
                </div>
              </div>
              <Link to="/dashboard">
                <Button className="gap-2 font-semibold group shadow-glow-sm">
                  Start Training Session <ArrowRight className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border/40 bg-background text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EmotionSense AI. Premium Communication Coaching Platform.</p>
        </footer>
      </div>
    </AnimatedPage>
  );
};

export default Home;
