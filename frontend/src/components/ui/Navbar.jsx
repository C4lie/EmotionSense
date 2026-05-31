import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Crown,
  LogOut,
  Menu,
  Mic,
  User,
  X,
  Sparkles,
  Video,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

/**
 * V3 Navbar — Floating Glass Navigation
 *
 * Features:
 * - Floating glass effect with backdrop blur
 * - Scroll-aware: transparent at top, solid blur on scroll
 * - Desktop: horizontal nav links + user actions
 * - Mobile: hamburger → animated slide drawer
 * - Updated branding: "Communication & Confidence Coach"
 */
export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  const navLinkClass = ({ isActive }) => cn(
    "flex items-center gap-1.5 text-sm font-medium transition-colors duration-200",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 h-16 transition-all duration-400 ease-out-expo",
        isScrolled
          ? "glass-nav shadow-elevated"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container mx-auto h-full px-4 flex items-center justify-between max-w-7xl">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMobile}>
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground font-display">
            Emotion<span className="text-gradient-primary">Sense</span>
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/dashboard" className={navLinkClass}>
            <Activity className="h-4 w-4" />
            Dashboard
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/speaking-trainer" className={navLinkClass}>
                <BrainCircuit className="h-4 w-4" />
                Confidence Builder
              </NavLink>
              <NavLink to="/interview-coach" className={navLinkClass}>
                <Video className="h-4 w-4" />
                Interview Coach
              </NavLink>
              <NavLink to="/analytics" className={navLinkClass}>
                <BarChart3 className="h-4 w-4" />
                Analytics
              </NavLink>
              {isPremium ? (
                <NavLink to="/tone-coach" className={({ isActive }) => cn(navLinkClass({ isActive }), "text-amber-400 hover:text-amber-300")}>
                  <Mic className="h-4 w-4" />
                  Tone Coach
                </NavLink>
              ) : (
                <NavLink to="/pricing" className={({ isActive }) => cn(navLinkClass({ isActive }), "text-amber-400/70 hover:text-amber-300")}>
                  <Crown className="h-4 w-4" />
                  Upgrade
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* ── Desktop Right Actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isPremium && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              )}
              <div className="flex items-center gap-2 p-1 pr-3 rounded-full bg-surface border border-border">
                <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
                  {user?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-accent-danger"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-all"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-border"
          >
            <div className="glass-panel p-5 space-y-3">
              {/* Nav Links */}
              <div className="space-y-1">
                <MobileNavLink to="/dashboard" icon={Activity} label="Dashboard" onClick={closeMobile} />
                {isAuthenticated && (
                  <>
                    <MobileNavLink to="/speaking-trainer" icon={BrainCircuit} label="Confidence Builder" onClick={closeMobile} />
                    <MobileNavLink to="/interview-coach" icon={Video} label="Interview Coach" onClick={closeMobile} />
                    <MobileNavLink to="/analytics" icon={BarChart3} label="Analytics" onClick={closeMobile} />
                    {isPremium ? (
                      <MobileNavLink to="/tone-coach" icon={Mic} label="Tone Coach" onClick={closeMobile} premium />
                    ) : (
                      <MobileNavLink to="/pricing" icon={Crown} label="Upgrade to Premium" onClick={closeMobile} premium />
                    )}
                  </>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Auth Actions */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                    <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Account</span>
                      <span className="text-sm font-semibold text-foreground truncate">{user?.name}</span>
                    </div>
                    {isPremium && (
                      <span className="ml-auto px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                        PRO
                      </span>
                    )}
                  </div>
                  <Button variant="destructive" onClick={handleLogout} fullWidth leftIcon={<LogOut className="h-4 w-4" />}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={closeMobile}>
                    <Button variant="outline" fullWidth>Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={closeMobile}>
                    <Button fullWidth>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/* ── Mobile Nav Link Helper ── */
const MobileNavLink = ({ to, icon: Icon, label, onClick, premium = false }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center gap-2.5 p-3 rounded-lg font-medium transition-all duration-200",
      "border border-transparent",
      isActive
        ? "bg-primary/10 text-foreground border-primary/10"
        : "text-muted-foreground hover:bg-surface hover:text-foreground hover:border-border/50",
      premium && !isActive && "text-amber-400/80 hover:text-amber-300",
    )}
  >
    <Icon className={cn("h-4 w-4", premium ? "text-amber-400" : "text-primary")} />
    {label}
  </NavLink>
);
