import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { Loader } from "./components/ui/Loader";
import { Dashboard } from "./features/dashboard/Dashboard";
import { AnalyticsDashboard } from "./features/analytics/AnalyticsDashboard";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

// A temporary playground page to verify Phase 3 components
const UIPlayground = () => {
  const [isLoading, setIsLoading] = useState(false);

  const triggerLoad = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-float" style={{ animationDuration: '8s' }}>
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-glow">
          Emotion<span className="text-primary">Sense</span> AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          An advanced real-time expression detection platform. Ready to check out the live feed?
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
          <Link to="/analytics">
            <Button size="lg" variant="outline">View Analytics</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card glow>
          <CardHeader>
            <CardTitle>Glassmorphism Cards</CardTitle>
            <CardDescription>Hover over me to see the subtle glow effect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Field</label>
              <Input placeholder="Enter some data..." />
            </div>
            
            <div className="pt-4 flex items-center justify-center border-t border-white/5">
               <Loader text="Authenticating..." size="md" />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost">Cancel</Button>
            <Button onClick={triggerLoad} isLoading={isLoading}>Save Changes</Button>
          </CardFooter>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-2">Deep Glass Panel</h3>
              <p className="text-sm text-muted-foreground">
                Notice the heavy blur and dark translucent background, perfect for floating modals and overlays.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<UIPlayground />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
