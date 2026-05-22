import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "../../components/ui/Button";
import { Smile, Mail, Lock, ShieldAlert, ArrowRight } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors on mount/unmount
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!email.trim() || !password.trim()) {
      setValidationError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // Success will trigger useEffect redirect
    } catch (err) {
      // Handled by store error field
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <Smile className="h-6 w-6 text-zinc-100" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              EmotionSense<span className="text-zinc-400">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to start capturing expression analytics.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Indicators */}
            {(validationError || error) && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError || error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-11 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2 focus-visible:border-zinc-700 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-11 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2 focus-visible:border-zinc-700 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-medium"
              isLoading={isSubmitting}
            >
              Sign In <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Registration Redirect Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-zinc-200 hover:text-white transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
