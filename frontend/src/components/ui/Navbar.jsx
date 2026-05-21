import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, Activity, BarChart3, LogOut, User } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "./Button";

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-blue-400 transition-colors">
          <BrainCircuit className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-white">
            Emotion<span className="text-primary">Sense</span> AI
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Live Dashboard
            </Link>
            {isAuthenticated && (
              <Link to="/analytics" className="hover:text-white transition-colors flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* User display badge */}
                <div className="hidden sm:flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white/5 border border-white/10">
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
        </div>
      </div>
    </nav>
  );
};
