import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Activity,
  BarChart3,
  LogOut,
  User,
  Mic,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { Button } from "./Button";

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-blue-400 transition-colors">
          <BrainCircuit className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-white">
            Emotion<span className="text-primary">Sense</span> AI
          </span>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Live Dashboard
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/speaking-trainer" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4" />
                  Speaking Trainer
                </Link>
                <Link to="/analytics" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
                {isPremium && (
                  <Link
                    to="/tone-coach"
                    className="hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <Mic className="h-4 w-4" />
                    Tone Coach
                  </Link>
                )}
                {!isPremium && (
                  <Link
                    to="/pricing"
                    className="hover:text-amber-300 text-amber-400/70 transition-colors flex items-center gap-1.5"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop Right Side Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Premium badge */}
                {isPremium && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}

                {/* User display badge */}
                <div className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-zinc-900 border border-zinc-800">
                  <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Glassmorphic Dropdown Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 inset-x-0 z-40 bg-zinc-950/95 border-b border-zinc-900 md:hidden flex flex-col p-5 gap-4 animate-in slide-in-from-top-4 duration-200 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:bg-zinc-900 p-3 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center gap-2.5 font-medium border border-transparent hover:border-white/[0.04]"
            >
              <Activity className="h-4 w-4 text-primary" />
              Live Dashboard
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/speaking-trainer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-zinc-900 p-3 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center gap-2.5 font-medium border border-transparent hover:border-white/[0.04]"
                >
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  Speaking Trainer
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-zinc-900 p-3 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center gap-2.5 font-medium border border-transparent hover:border-white/[0.04]"
                >
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Analytics Logs
                </Link>
                {isPremium ? (
                  <Link
                    to="/tone-coach"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:bg-zinc-900 p-3 rounded-lg text-amber-400 hover:text-amber-300 transition-all flex items-center gap-2.5 font-medium border border-transparent hover:border-amber-500/10 bg-amber-500/5"
                  >
                    <Mic className="h-4 w-4" />
                    Vocal Tone Coach
                  </Link>
                ) : (
                  <Link
                    to="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:bg-zinc-900 p-3 rounded-lg text-amber-400/80 hover:text-amber-300 transition-all flex items-center gap-2.5 font-medium border border-transparent hover:border-amber-500/10 bg-amber-500/5"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="h-px bg-zinc-900 my-1" />

          {/* Mobile User Profile / Auth State Drawer Actions */}
          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="space-y-3">
                {/* User Info Details card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/45 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Account</span>
                    <span className="text-sm font-semibold text-white truncate max-w-[200px]">
                      {user?.name}
                    </span>
                  </div>
                  {isPremium && (
                    <span className="ml-auto flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                      PRO
                    </span>
                  )}
                </div>

                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-sm">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full text-sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

