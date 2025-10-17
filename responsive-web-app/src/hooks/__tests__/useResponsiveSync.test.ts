import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResponsiveSync, useResponsiveTransition, useResponsiveLayoutStability } from '../useResponsiveSync';

// Mock the dependencies
vi.mock('../useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    showSidebarInHeader: false,
    breakpoint: 'desktop'
  }))
}));

vi.mock('../../store/slices/uiSlice', () => ({
  useUI: vi.fn(() => ({
    showSidebarInHeader: false,
    lastBreakpoint: 'desktop',
    isTransitioning: false,
    headerLayout: {
      left: { visible: false, elements: [] },
      center: { visible: true, content: null },
      right: { visible: true, elements: ['notifications', 'user-menu'] }
    },
    setShowSidebarInHeader: vi.fn(),
    setTransitioning: vi.fn(),
    updateBreakpoint: vi.fn(),
    setScreenSize: vi.fn()
  }))
}));

describe('useResponsiveSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current responsive state', () => {
    const { result } = renderHook(() => useResponsiveSync());

    expect(result.current).toMatchObject({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop',
      showSidebarInHeader: false,
      isTransitioning: false,
      lastBreakpoint: 'desktop'
    });
  });

  it('should detect breakpoint changes', () => {
    const { result } = renderHook(() => useResponsiveSync());

    expect(result.current.isBreakpointChanging).toBe(false);
    expect(result.current.isSidebarHeaderVisibilityChanging).toBe(false);
  });
});

describe('useResponsiveTransition', () => {
  it('should return transition state', () => {
    const { result } = renderHook(() => useResponsiveTransition());

    expect(result.current).toMatchObject({
      isTransitioning: false,
      fromBreakpoint: 'desktop',
      toBreakpoint: 'desktop',
      showSidebarInHeader: false
    });
  });

  it('should provide helper functions', () => {
    const { result } = renderHook(() => useResponsiveTransition());

    expect(typeof result.current.isTransitioningTo).toBe('function');
    expect(typeof result.current.isTransitioningFrom).toBe('function');
    expect(typeof result.current.isTransitioningBetween).toBe('function');
  });
});

describe('useResponsiveLayoutStability', () => {
  it('should return CSS classes and styles', () => {
    const { result } = renderHook(() => useResponsiveLayoutStability());

    expect(result.current.transitionClasses).toContain('breakpoint-desktop');
    expect(typeof result.current.stabilityStyles).toBe('object');
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.showSidebarInHeader).toBe(false);
    expect(result.current.breakpoint).toBe('desktop');
  });

  it('should include transition classes when transitioning', () => {
    // Mock transitioning state
    const { useUI } = await import('../../store/slices/uiSlice');
    vi.mocked(useUI).mockReturnValue({
      showSidebarInHeader: true,
      lastBreakpoint: 'desktop',
      isTransitioning: true,
      headerLayout: {
        left: { visible: true, elements: ['menu-toggle', 'brand'] },
        center: { visible: true, content: null },
        right: { visible: true, elements: ['notifications', 'user-menu'] }
      },
      setShowSidebarInHeader: vi.fn(),
      setTransitioning: vi.fn(),
      updateBreakpoint: vi.fn(),
      setScreenSize: vi.fn()
    } as any);

    const { result } = renderHook(() => useResponsiveLayoutStability());

    expect(result.current.transitionClasses).toContain('responsive-transitioning');
    expect(result.current.transitionClasses).toContain('sidebar-in-header');
    expect(result.current.stabilityStyles).toHaveProperty('willChange');
    expect(result.current.stabilityStyles).toHaveProperty('transition');
  });
});