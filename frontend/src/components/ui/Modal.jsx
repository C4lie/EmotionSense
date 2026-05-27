import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { overlayAnimation, modalAnimation, bottomSheetAnimation } from "../../utils/animations";

/**
 * V3 Modal Component
 *
 * Premium modal with backdrop blur. Automatically converts to a
 * bottom sheet on mobile for touch-friendly interaction.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when user dismisses modal
 * @param {string} title - Modal header title
 * @param {string} description - Optional subtitle/description
 * @param {string} size - "sm" | "md" | "lg" | "xl" | "full"
 * @param {boolean} showClose - Show close button (default: true)
 * @param {boolean} closeOnOverlay - Close on overlay click (default: true)
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  showClose = true,
  closeOnOverlay = true,
  children,
  className,
  footer,
}) => {
  const { isMobile } = useMediaQuery();

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-3xl",
  };

  const contentAnimation = isMobile ? bottomSheetAnimation : modalAnimation;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
            {...overlayAnimation}
          />

          {/* Modal Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            className={cn(
              "relative z-10 w-full",
              /* Desktop: centered card */
              "sm:rounded-2xl",
              /* Mobile: bottom sheet */
              "rounded-t-2xl sm:rounded-b-2xl",
              "bg-card border border-border shadow-elevated-lg",
              "max-h-[90vh] overflow-y-auto",
              sizes[size],
              className,
            )}
            {...contentAnimation}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div className="space-y-1 pr-8">
                  {title && (
                    <h2 id="modal-title" className="text-lg font-semibold font-display tracking-tight text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0 border-t border-border mt-2 pt-4">
                {footer}
              </div>
            )}

            {/* Mobile drag indicator */}
            {isMobile && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-muted-foreground/30" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
