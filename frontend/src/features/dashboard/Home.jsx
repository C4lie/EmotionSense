import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Activity, ShieldCheck, Heart, Zap, Sparkles, UserPlus, Video, BookOpen } from "lucide-react";
import heroBg from "../../assets/hero_background.png";
import logoImg from "../../assets/emotionsense_logo.png";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";

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
                  By reviewing daily daily metrics and session histories, you develop absolute control over how you project your emotions, putting you steps ahead in any social or business dynamic.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual Toolkit Section: What is the use of what? */}
      <section className="relative py-24 px-4 bg-zinc-950/40 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
              The Confidence-Building Toolkit
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
              Wondering where to start? Here is an overview of the core tools available on the website and what they are used for.
            </p>
            <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto mt-4" />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Tool 1: Live Camera Dashboard */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <Video className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">1. Live Expression Dashboard</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  <strong>Use Case:</strong> Real-time emotional self-awareness. Use this to see how your facial muscles express emotions. It helps you recognize if you look angry, sad, fearful, or neutral when communicating.
                </p>
                
                {/* Mini Visual Mockup of Camera & Face Tracking */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Mock Webcam bounding box outline */}
                  <div className="relative border border-primary/40 rounded-lg p-2 flex flex-col items-center bg-zinc-900/50 w-44 h-32 justify-center">
                    {/* Bounding box corner ticks */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />
                    
                    {/* Mock avatar / face representation */}
                    <div className="text-4xl filter grayscale contrast-150">😊</div>
                    <div className="text-[10px] font-mono text-primary mt-2 uppercase tracking-widest font-bold">Face Detected</div>
                    <div className="bg-primary/25 border border-primary/30 rounded px-1.5 py-0.5 mt-1 text-[8px] text-primary-foreground font-black">
                      HAPPY 92.4%
                    </div>
                  </div>
                  
                  {/* Side status panel */}
                  <div className="ml-4 flex flex-col gap-1.5 w-32">
                    <div className="h-2 w-full bg-zinc-805 rounded overflow-hidden bg-zinc-800">
                      <div className="h-full bg-primary rounded" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Happy (92%)</span>
                    <div className="h-2 w-full bg-zinc-805 rounded overflow-hidden bg-zinc-800">
                      <div className="h-full bg-zinc-700 rounded" style={{ width: '8%' }}></div>
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Neutral (8%)</span>
                  </div>
                </div>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full text-xs gap-1 border-zinc-800 hover:bg-primary/10 hover:border-primary/30">
                  Open Live Dashboard <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Tool 2: Public Speaking Trainer */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-purple-500/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">2. Speaking Trainer</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  <strong>Use Case:</strong> Presentation & speech practice. Use this to paste custom speech scripts, read from a scrolling teleprompter, and receive instant feedback on speaking stability and timing.
                </p>

                {/* Mini Visual Mockup of Prompter and Teleprompter */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1 flex justify-between">
                    <span>Teleprompter Mode</span>
                    <span className="text-purple-400 animate-pulse font-bold">● Rec</span>
                  </div>
                  
                  {/* Scrolling prompter simulation */}
                  <div className="my-2 text-center text-xs text-zinc-300 font-medium select-none overflow-hidden h-14 relative">
                    <div className="text-[9px] text-zinc-600 line-through">Welcome to my keynote presentation.</div>
                    <div className="text-purple-400 font-bold border-y border-purple-500/20 py-0.5 bg-purple-500/5">Today, I want to talk about how AI is shaping the future...</div>
                    <div className="text-[9px] text-zinc-500">and how we can leverage these changes to build tools...</div>
                  </div>

                  {/* Meter status bar */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-500">
                    <span>Duration: 01:24 / 03:00</span>
                    <span className="bg-purple-500/10 border border-purple-500/20 px-1 rounded text-purple-400">Pace: 130 WPM</span>
                  </div>
                </div>
              </div>
              <Link to="/speaking-trainer">
                <Button variant="outline" className="w-full text-xs gap-1 border-zinc-800 hover:bg-purple-500/10 hover:border-purple-500/30">
                  Open Speaking Trainer <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Tool 3: Deep Analytics */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">3. Emotional Intelligence Logs</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  <strong>Use Case:</strong> Mood charting over time. Use this to review historical reports, stability averages, and positivity scores to see how your confidence improves day by day.
                </p>

                {/* Mini Visual Mockup of Line Chart */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">
                    Positivity & Confidence Curve
                  </div>
                  
                  {/* Simulated Line Chart drawing via SVG */}
                  <div className="h-20 w-full relative mt-2">
                    <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M 0 35 L 20 28 L 40 30 L 60 18 L 80 12 L 100 8" />
                      <circle cx="20" cy="28" r="2" fill="currentColor" />
                      <circle cx="40" cy="30" r="2" fill="currentColor" />
                      <circle cx="60" cy="18" r="2" fill="currentColor" />
                      <circle cx="80" cy="12" r="2" fill="currentColor" />
                      <circle cx="100" cy="8" r="2" fill="currentColor" />
                      {/* Gradient fill */}
                      <path d="M 0 35 L 20 28 L 40 30 L 60 18 L 80 12 L 100 8 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.05" stroke="none" />
                    </svg>
                    {/* Metric badge overlay */}
                    <div className="absolute top-2 left-2 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded text-[8px] text-indigo-400 font-bold">
                      +14.5% Growth
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[8px] text-zinc-600 uppercase font-bold px-1">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
              <Link to="/analytics">
                <Button variant="outline" className="w-full text-xs gap-1 border-zinc-800 hover:bg-indigo-500/10 hover:border-indigo-500/30">
                  Open Analytics <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Tool 4: AI Tone Coach (Premium) */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">4. AI Tone Coach</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  <strong>Use Case:</strong> Speaking dynamics analysis. Use this to audit vocal speed, energy, pause rhythms, and hesitation counts, helping you sound more authoritative and clear.
                </p>

                {/* Mini Visual Mockup of Audio analysis */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 mb-6 relative overflow-hidden h-40 flex flex-col justify-between">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1 flex justify-between">
                    <span>Vocal Energy Spectrogram</span>
                    <span className="text-emerald-400 font-bold">Premium Mode</span>
                  </div>
                  
                  {/* Simulated wave bars */}
                  <div className="flex items-end justify-center gap-1.5 h-16 my-2">
                    <div className="w-2.5 bg-zinc-800 rounded-t h-4 group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="w-2.5 bg-zinc-700 rounded-t h-8 group-hover:bg-emerald-500/30 transition-all"></div>
                    <div className="w-2.5 bg-zinc-800 rounded-t h-6 group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="w-2.5 bg-emerald-500/40 rounded-t h-12"></div>
                    <div className="w-2.5 bg-emerald-500/60 rounded-t h-14"></div>
                    <div className="w-2.5 bg-emerald-500/30 rounded-t h-8"></div>
                    <div className="w-2.5 bg-zinc-700 rounded-t h-10 group-hover:bg-emerald-500/35 transition-all"></div>
                    <div className="w-2.5 bg-zinc-800 rounded-t h-5 group-hover:bg-emerald-500/20 transition-all"></div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-zinc-500">
                    <span>Vocal Confidence: 88/100</span>
                    <span className="text-emerald-400">Energy Level: High</span>
                  </div>
                </div>
              </div>
              <Link to="/tone-coach">
                <Button variant="outline" className="w-full text-xs gap-1 border-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/30">
                  Open Tone Coach <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Step-by-Step Guidance Section */}
      <section className="relative py-24 px-4 bg-zinc-950/60 border-t border-zinc-900 overflow-hidden">
        {/* Decorative background doodles / blobs */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Interactive Walkthrough
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
              How to Build Your Confidence
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
              A quick walkthrough to show you how to utilize our AI-powered features and metrics to practice public speaking.
            </p>
          </div>

          {/* Stepper Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-3 text-7xl font-black text-white/5 select-none transition-all group-hover:text-primary/10">01</div>
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden h-full">
                <CardContent className="pt-8 pb-6">
                  {/* Decorative hand-drawn style doodle background (SVG) */}
                  <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-800/20 pointer-events-none group-hover:text-primary/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="50" cy="50" r="30" strokeDasharray="5 5" />
                    <path d="M20 20 L80 80 M80 20 L20 80" />
                  </svg>
                  
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white font-display">Create Account</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sign up or log in to secure your private workspace. This unlocks session history tracking and personalized growth benchmarks.
                  </p>
                </CardContent>
              </Card>
              {/* Hand-drawn connector arrow to Step 2 (visible on desktop) */}
              <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-12 h-8 z-20 pointer-events-none text-zinc-700/60 group-hover:text-primary/45 transition-colors duration-300">
                <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12 C 12 4, 36 20, 44 12" strokeDasharray="4 4" />
                  <path d="M38 6 L44 12 L38 18" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-3 text-7xl font-black text-white/5 select-none transition-all group-hover:text-purple-500/10">02</div>
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-md hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden h-full">
                <CardContent className="pt-8 pb-6">
                  {/* Decorative Hand-drawn swirl doodle SVG */}
                  <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-800/20 pointer-events-none group-hover:text-purple-500/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 50 C 30 20, 70 80, 90 50" strokeDasharray="3 3" />
                    <circle cx="90" cy="50" r="4" fill="currentColor" />
                  </svg>
                  
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <Video className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white font-display">Enable Camera</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Go to the Live Dashboard or Speaking Trainer. Grant camera access to initialize our lightweight face tracking boundary box.
                  </p>
                </CardContent>
              </Card>
              {/* Hand-drawn connector arrow to Step 3 (visible on desktop) */}
              <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-12 h-8 z-20 pointer-events-none text-zinc-700/60 group-hover:text-purple-500/45 transition-colors duration-300">
                <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12 C 12 20, 36 4, 44 12" strokeDasharray="4 4" />
                  <path d="M38 6 L44 12 L38 18" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-3 text-7xl font-black text-white/5 select-none transition-all group-hover:text-indigo-500/10">03</div>
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden h-full">
                <CardContent className="pt-8 pb-6">
                  {/* Decorative abstract box doodle SVG */}
                  <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-800/20 pointer-events-none group-hover:text-indigo-500/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="25" y="25" width="50" height="50" rx="5" strokeDasharray="4 4" />
                    <path d="M40 50 L60 50 M50 40 L50 60" />
                  </svg>
                  
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white font-display">Configure Scripts</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Select an AI-generated speech preset or paste your own custom presentation script. Set your target duration (30s to 3m) to begin.
                  </p>
                </CardContent>
              </Card>
              {/* Hand-drawn connector arrow to Step 4 (visible on desktop) */}
              <div className="hidden lg:block absolute top-1/2 -right-7 -translate-y-1/2 w-12 h-8 z-20 pointer-events-none text-zinc-700/60 group-hover:text-indigo-500/45 transition-colors duration-300">
                <svg className="w-full h-full" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12 C 12 4, 36 20, 44 12" strokeDasharray="4 4" />
                  <path d="M38 6 L44 12 L38 18" />
                </svg>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-3 text-7xl font-black text-white/5 select-none transition-all group-hover:text-emerald-500/10">04</div>
              <Card className="bg-zinc-900/20 border-zinc-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden h-full">
                <CardContent className="pt-8 pb-6">
                  {/* Decorative target/arrows doodle SVG */}
                  <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-800/20 pointer-events-none group-hover:text-emerald-500/5 transition-all duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="50" cy="50" r="10" />
                    <circle cx="50" cy="50" r="25" />
                    <path d="M50 10 L50 25 M50 75 L50 90 M10 50 L25 50 M75 50 L90 50" />
                  </svg>
                  
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white font-display">Practice & Analytics</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Follow the scrolling prompter. Real-time feedback alerts suggest improvements. Complete the run to view your stability, eye-contact, and confidence curves.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick interactive mode guide doodle banner */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.05] bg-zinc-900/25 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-black shadow-lg">
                🚀
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-display">Ready to master your communication?</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Explore the live camera feedback modes and practice presentations to start building confidence.</p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button className="gap-2 font-semibold">
                Start Free Session <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
