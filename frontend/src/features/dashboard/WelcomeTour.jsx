import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Video,
  BrainCircuit,
  BarChart3,
  Mic,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  Play,
  ArrowRight
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";

const TOUR_STEPS = [
  {
    title: "1. Live Expression Dashboard",
    path: "/dashboard",
    icon: Video,
    color: "from-purple-500 to-blue-500",
    glowColor: "rgba(168,85,247,0.4)",
    useCase: "Real-time non-verbal feedback and facial expression telemetry.",
    whatToDoFirst: "Locate the 'Control Deck' on the right. Ensure your webcam is selected, then click 'Start Camera'. As you speak or change expressions, watch the AI neural networks decode your emotions (happiness, neutral, surprise, etc.) in real-time, plotting a live confidence score and weight breakdown.",
    actionText: "Launch Camera Feed"
  },
  {
    title: "2. Public Speaking Trainer",
    path: "/speaking-trainer",
    icon: BrainCircuit,
    color: "from-fuchsia-500 to-purple-500",
    glowColor: "rgba(217,70,239,0.4)",
    useCase: "Rehearsing presentations, tracking speaking pace, and posture alignment.",
    whatToDoFirst: "Choose one of our pre-configured script presets (e.g. HR Interview, Startup Pitch) or paste your own script. Set your target practice duration and click 'Start Practice'. As you read from the scrolling teleprompter, the AI will trigger real-time audio-visual suggestions if you lose focus or eye contact.",
    actionText: "Open Speaking Trainer"
  },
  {
    title: "3. Historical Analytics Logs",
    path: "/analytics",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-500",
    glowColor: "rgba(59,130,246,0.4)",
    useCase: "Monitoring personal improvement, average expression levels, and timeline consistency.",
    whatToDoFirst: "After completing your first live or speaking sessions, visit the Analytics page. Review your Mood Timeline curve, check average session duration statistics, and see your expression distribution percentages. You can also view or delete past session records from the history log.",
    actionText: "Inspect Analytics"
  },
  {
    title: "4. AI Vocal Tone Coach",
    path: "/tone-coach",
    icon: Mic,
    color: "from-emerald-500 to-teal-500",
    glowColor: "rgba(16,185,129,0.4)",
    useCase: "Vocal analytics checking speech speed, volume metrics, and hesitation rhythms.",
    whatToDoFirst: "Upgrade to Premium to unlock the microphone analytics. Grant microphone access, click record, and speak. The AI Tone Coach will audit your words per minute (WPM), voice clarity, energy dynamics, and highlight long hesitation pauses.",
    actionText: "Open Tone Coach"
  }
];

export const WelcomeTour = ({ forceOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if the user has completed the onboarding tour before
    const hasSeenTour = localStorage.getItem("has_seen_onboarding_tour");
    if (!hasSeenTour || forceOpen) {
      setIsOpen(true);
      if (forceOpen) {
        setCurrentStep(0);
      }
    }
  }, [forceOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem("has_seen_onboarding_tour", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNavigateToFeature = (path) => {
    // Navigate to the feature path
    navigate(path);
    // If the path is the current page, we keep the tour open; otherwise we can close or let it persist
    if (location.pathname !== path) {
      // Close the tour modal so they can focus on the navigated page
      handleClose();
    }
  };

  if (!isOpen) return null;

  const stepInfo = TOUR_STEPS[currentStep];
  const StepIcon = stepInfo.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300">
      {/* Glow Backdrop */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-all duration-500 ease-in-out opacity-25"
        style={{
          backgroundColor: stepInfo.glowColor,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      />

      <Card className="max-w-2xl w-full bg-zinc-950/85 border border-zinc-800/90 shadow-2xl relative overflow-hidden animate-in fade-in duration-300 zoom-in-95 backdrop-blur-2xl">
        {/* Neon top border line */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${stepInfo.color} transition-all duration-500`} />

        {/* Header toolbar */}
        <div className="flex justify-between items-center px-6 pt-6 pb-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Platform Tour
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all"
            title="Skip Onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Box */}
        <CardContent className="pt-4 pb-6 px-6 sm:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${stepInfo.color} text-white shadow-lg transition-all duration-500 transform group-hover:scale-105 shrink-0`}>
              <StepIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mb-2">
                {stepInfo.title}
              </h2>
              <p className="text-xs text-primary font-bold tracking-widest uppercase mb-1">Use Case:</p>
              <p className="text-sm font-semibold text-zinc-350 leading-relaxed">
                {stepInfo.useCase}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl mb-6 relative">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              🚀 What to do first:
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
              {stepInfo.whatToDoFirst}
            </p>
          </div>

          {/* Stepper Dots & Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900">
            {/* Dots */}
            <div className="flex gap-2">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep 
                      ? `w-6 bg-gradient-to-r ${stepInfo.color}` 
                      : "w-2 bg-zinc-800 hover:bg-zinc-700"
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToFeature(stepInfo.path)}
                className={`gap-1 text-xs border-zinc-850 hover:bg-white/[0.04] transition-all`}
              >
                <Play className="h-3 w-3 text-primary" /> {stepInfo.actionText}
              </Button>

              <div className="h-6 w-px bg-zinc-900 hidden sm:block" />

              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}

              <Button
                variant={currentStep === TOUR_STEPS.length - 1 ? "primary" : "secondary"}
                size="sm"
                onClick={handleNext}
                className="gap-1.5 text-xs font-bold min-w-[70px]"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  "Finish"
                ) : (
                  <>
                    Next <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
