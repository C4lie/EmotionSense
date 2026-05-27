import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/ui/Navbar";
import { BottomNav } from "../components/ui/BottomNav";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../utils/cn";

export const Layout = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      {/* Add top padding so content is below fixed navbar, and bottom padding on mobile if authenticated */}
      <main className={cn("flex-1 pt-16", isAuthenticated && "pb-16 md:pb-0")}>
        <Outlet />
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
};
