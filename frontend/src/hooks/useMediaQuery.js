import { useState, useEffect, useCallback } from "react";

/**
 * V3 Responsive breakpoint hook.
 * 
 * Returns boolean flags for current viewport size.
 * Uses matchMedia for efficient, event-driven updates (no resize polling).
 * 
 * Breakpoints match Tailwind config:
 *   mobile:  < 640px
 *   tablet:  640px – 1023px
 *   desktop: >= 1024px
 * 
 * Usage:
 *   const { isMobile, isTablet, isDesktop } = useMediaQuery();
 */
const BREAKPOINTS = {
  tablet: "(min-width: 640px)",
  desktop: "(min-width: 1024px)",
  largeDesktop: "(min-width: 1280px)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
};

export function useMediaQuery() {
  const getMatches = useCallback(() => {
    if (typeof window === "undefined") {
      return { isTablet: false, isDesktop: false, isLargeDesktop: false, prefersReducedMotion: false };
    }
    return {
      isTablet: window.matchMedia(BREAKPOINTS.tablet).matches,
      isDesktop: window.matchMedia(BREAKPOINTS.desktop).matches,
      isLargeDesktop: window.matchMedia(BREAKPOINTS.largeDesktop).matches,
      prefersReducedMotion: window.matchMedia(BREAKPOINTS.reducedMotion).matches,
    };
  }, []);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const queries = Object.values(BREAKPOINTS).map((q) => window.matchMedia(q));

    const handleChange = () => setMatches(getMatches());

    queries.forEach((mql) => mql.addEventListener("change", handleChange));
    return () => {
      queries.forEach((mql) => mql.removeEventListener("change", handleChange));
    };
  }, [getMatches]);

  return {
    isMobile: !matches.isTablet,
    isTablet: matches.isTablet && !matches.isDesktop,
    isDesktop: matches.isDesktop,
    isLargeDesktop: matches.isLargeDesktop,
    prefersReducedMotion: matches.prefersReducedMotion,
  };
}
