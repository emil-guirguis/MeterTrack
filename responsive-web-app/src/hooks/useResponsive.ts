import { useState, useEffect } from 'react';
import type { UseResponsiveResult } from '../types/ui';

// Breakpoint values (in pixels)
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
} as const;

export const useResponsive = (): UseResponsiveResult => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < BREAKPOINTS.mobile;
  const isTablet = screenSize.width >= BREAKPOINTS.mobile && screenSize.width < BREAKPOINTS.tablet;
  const isDesktop = screenSize.width >= BREAKPOINTS.tablet && screenSize.width < BREAKPOINTS.desktop;
  const isLarge = screenSize.width >= BREAKPOINTS.desktop;

  const getBreakpoint = (): 'mobile' | 'tablet' | 'desktop' | 'large' => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'large';
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    breakpoint: getBreakpoint()
  };
};

// Hook for specific media queries
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

// Predefined breakpoint hooks
export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
};

export const useIsTablet = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
};

export const useIsLarge = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
};

// Hook for touch device detection
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
};

export default useResponsive;