import React, { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { useRouterState } from "@tanstack/react-router";

const SmoothScrollContext = createContext<Lenis | null>(null);

export const useSmoothScroll = () => useContext(SmoothScrollContext);

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const routerState = useRouterState();
  const locationPath = routerState.location.pathname;

  useEffect(() => {
    // 1. Respect user's system preferences for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      console.log("Smooth scroll disabled: prefers-reduced-motion detected.");
      return;
    }

    // 2. Initialize Lenis with premium easing settings
    // - duration: 1.1s is fast enough to feel responsive, slow enough to feel smooth.
    // - easing: exponential decay curve that mimics natural momentum deceleration.
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      smoothTouch: false, // Keep touchpad/touchscreen events native for direct response
      wheelMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    // 3. Drive the smooth scroll with a requestAnimationFrame loop
    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    // 4. Set up dynamic resizing via ResizeObserver on the document body
    // This handles asynchronous data loads (e.g. stock lists, charts loading) without scroll height bugs
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });
    
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // 5. Intercept internal anchor links (`href="#id"`) for smooth scrolling transitions
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          
          // Let TanStack router update URL state if needed, or scroll immediately
          lenis.scrollTo(targetElement, {
            offset: 0,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    // Cleanup scroll container configurations and event listeners
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 6. Sync and recalculate scroll height/dimensions on client-side route navigation
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    // Give a brief tick for the DOM to update after path change before recalculating limits
    const timeoutId = setTimeout(() => {
      lenis.resize();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [locationPath]);

  return (
    <SmoothScrollContext.Provider value={lenisRef.current}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
