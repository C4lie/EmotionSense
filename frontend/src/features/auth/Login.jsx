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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background radial glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <Smile className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              EmotionSense<span className="text-primary">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to start capturing expression analytics.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
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
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-black/40 pl-11 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary transition-all duration-300"
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
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-black/40 pl-11 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary transition-all duration-300"
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
              className="font-medium text-primary hover:text-blue-400 transition-colors"
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
