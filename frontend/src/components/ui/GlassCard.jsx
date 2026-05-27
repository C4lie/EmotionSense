import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * V3 GlassCard Component
 *
 * Premium glass-morphism card with optional 3D parallax tilt on hover (desktop).
 * Subtle border glow follows mouse position for interactive feel.
 *
 * @param {boolean} tilt - Enable parallax tilt effect (desktop only)
 * @param {boolean} borderGlow - Enable mouse-following border glow
 * @param {string} glowColor - Custom glow color (HSL values)
 */
export const GlassCard = ({
  children,
  className,
  tilt = false,
  borderGlow = true,
  glowColor = "var(--color-accent-primary)",
  ...props
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [3, -3]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-3, 3]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || !tilt) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "glass-card",
        "transition-all duration-400 ease-out-expo",
        className,
      )}
      style={tilt ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Mouse-following glow */}
      {borderGlow && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-400"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background: `radial-gradient(
              300px circle at ${mouseX.get() * 100}% ${mouseY.get() * 100}%,
              hsl(${glowColor} / 0.08),
              transparent 60%
            )`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
