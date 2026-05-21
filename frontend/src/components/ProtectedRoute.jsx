import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Loader } from "./ui/Loader";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader text="Verifying session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
