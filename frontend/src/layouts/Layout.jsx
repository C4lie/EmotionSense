import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/ui/Navbar";

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      {/* Add top padding so content is below fixed navbar */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
};
