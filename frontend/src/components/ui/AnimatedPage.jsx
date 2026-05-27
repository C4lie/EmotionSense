import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { pageTransition } from "../../utils/animations";

/**
 * V3 AnimatedPage Wrapper
 *
 * Wraps page content with smooth entry/exit transitions.
 * Uses Framer Motion's layout animations for seamless route changes.
 *
 * Usage:
 *   <AnimatedPage>
 *     <YourPageContent />
 *   </AnimatedPage>
 *
 * @param {string} direction - "up" | "down" | "left" | "right" (entry direction)
 * @param {number} delay - Animation start delay in seconds
 */
export const AnimatedPage = ({
  children,
  className,
  direction = "up",
  delay = 0,
}) => {
  const directionMap = {
    up: { y: 12 },
    down: { y: -12 },
    left: { x: 16 },
    right: { x: -16 },
  };

  const initialOffset = directionMap[direction] || directionMap.up;

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
          delay,
        },
      }}
      exit={{
        opacity: 0,
        ...initialOffset,
        transition: {
          duration: 0.25,
          ease: [0.65, 0, 0.35, 1],
        },
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
};

/**
 * V3 Stagger Container
 *
 * Animates children sequentially with staggered delays.
 *
 * Usage:
 *   <StaggerContainer>
 *     <StaggerItem>Item 1</StaggerItem>
 *     <StaggerItem>Item 2</StaggerItem>
 *   </StaggerContainer>
 */
export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.06,
  initialDelay = 0.1,
}) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={{
      initial: {},
      animate: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: initialDelay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }) => (
  <motion.div
    variants={{
      initial: { opacity: 0, y: 12 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);
