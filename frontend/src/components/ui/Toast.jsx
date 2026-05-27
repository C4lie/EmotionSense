import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { toastAnimation } from "../../utils/animations";

/**
 * V3 Toast Notification System
 *
 * Usage:
 *   1. Wrap app with <ToastProvider>
 *   2. const { addToast } = useToast();
 *   3. addToast({ title: "Saved!", variant: "success" });
 */

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const TOAST_DURATION = 4000;
const MAX_VISIBLE = 3;

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-accent-success" />,
  error: <AlertCircle className="h-4 w-4 text-accent-danger" />,
  warning: <AlertTriangle className="h-4 w-4 text-accent-warning" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

const STYLES = {
  success: "border-accent-success/20 bg-accent-success/5",
  error: "border-accent-danger/20 bg-accent-danger/5",
  warning: "border-accent-warning/20 bg-accent-warning/5",
  info: "border-primary/20 bg-primary/5",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const addToast = useCallback(({ title, description, variant = "info", duration = TOAST_DURATION }) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, title, description, variant, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div
    className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    aria-live="polite"
  >
    <AnimatePresence mode="popLayout">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </AnimatePresence>
  </div>
);

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      layout
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl",
        "border backdrop-blur-xl shadow-elevated-lg",
        "bg-card",
        STYLES[toast.variant],
      )}
      {...toastAnimation}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.variant]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};
