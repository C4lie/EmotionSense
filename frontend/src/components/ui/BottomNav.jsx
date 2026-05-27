import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  BrainCircuit,
  BarChart3,
  Target,
  User,
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * V3 Bottom Navigation (Mobile)
 *
 * Touch-optimized bottom tab bar for mobile viewports.
 * Shows only when user is authenticated (dashboard context).
 * Uses NavLink for active route detection.
 */

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/speaking-trainer", label: "Practice", icon: BrainCircuit },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/challenges", label: "Challenges", icon: Target },
  { path: "/settings", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 md:hidden",
        "glass-nav",
        "border-t border-border/50",
        "pb-safe",
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center gap-0.5 w-full h-full"
              aria-label={label}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-250",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
