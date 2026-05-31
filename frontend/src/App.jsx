import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { Loader } from "./components/ui/Loader";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { useWebcamStore } from "./store/useWebcamStore";
import { detectService } from "./services/detectService";

// Lazy-loaded page components
const Home = lazy(() => import("./features/dashboard/Home"));
const Login = lazy(() => import("./features/auth/Login"));
const Register = lazy(() => import("./features/auth/Register"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const SpeakingTrainerDashboard = lazy(() => import("./features/dashboard/SpeakingTrainerDashboard"));
const AnalyticsDashboard = lazy(() => import("./features/analytics/AnalyticsDashboard"));
const InterviewCoachDashboard = lazy(() => import("./features/interview/InterviewCoachDashboard"));

// Premium feature pages (lazy-loaded)
const PricingPage = lazy(() => import("./features/premium/PricingPage"));
const ToneCoachDashboard = lazy(() => import("./features/premium/ToneCoachDashboard"));
const ToneHistory = lazy(() => import("./features/premium/ToneHistory"));

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const setModelReady = useWebcamStore((state) => state.setModelReady);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Poll status globally until the AI engine model is ready
  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        const statusData = await detectService.getModelStatus();
        setModelReady(statusData.model_ready);
      } catch {
        setModelReady(false);
      }
    };

    checkModelStatus();

    const interval = setInterval(() => {
      if (!useWebcamStore.getState().isModelReady) {
        checkModelStatus();
      } else {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [setModelReady]);

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-[80vh] flex items-center justify-center">
            <Loader size="lg" text="Loading page..." />
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/speaking-trainer"
              element={
                <ProtectedRoute>
                  <SpeakingTrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview-coach"
              element={
                <ProtectedRoute>
                  <InterviewCoachDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Premium Protected Routes */}
            <Route
              path="/tone-coach"
              element={
                <ProtectedRoute>
                  <ToneCoachDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tone-history"
              element={
                <ProtectedRoute>
                  <ToneHistory />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
