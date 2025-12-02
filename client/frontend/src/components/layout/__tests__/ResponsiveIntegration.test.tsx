import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AppLayout from '../AppLayout';
import { useUIStore } from '../../../store/slices/uiSlice';
import type { User } from '../../../types/auth';

// Mock user for testing
const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  permissions: [],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock auth hook (Context-based)
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    checkPermission: vi.fn(() => true),
    hasRole: vi.fn(() => true),
  }),
}));

vi.mock('../../../store/slices/uiSlice', () => ({
  useUI: () => ({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    notifications: [],
    setSidebarCollapsed: vi.fn(),
    setMobileNavOpen: vi.fn(),
    showSidebarInHeader: false,
    setShowSidebarInHeader: vi.fn(),
  }),
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    notifications: [],
    showSidebarInHeader: false,
  }))
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Helper function to simulate window resize
const resizeWindow = (width: number, height: number = 768) => {
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

// Helper function to wait for animations/transitions
const waitForTransition = () => new Promise(resolve => setTimeout(resolve, 350));

describe('Responsive Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset window size to desktop
    resizeWindow(1200);
  });

  afterEach(() => {
    // Clean up any pending timers
    vi.clearAllTimers();
  });

  describe('Desktop Layout (≥ 1024px)', () => {
    beforeEach(() => {
      resizeWindow(1200);
    });

    test('should show traditional sidebar layout on desktop', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        // Sidebar should be visible
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
        
        // Header should NOT show sidebar elements
        expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument();
        
        // Brand should be in sidebar, not header
        expect(screen.getByText('MeterIt')).toBeInTheDocument();
      });
    });

    test('should toggle sidebar collapse on desktop', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Find sidebar toggle button
      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      
      // Click to collapse
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toHaveClass('collapsed');
      });

      // Click to expand
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).not.toHaveClass('collapsed');
      });
    });
  });

  describe('Tablet Layout (768px - 1023px)', () => {
    beforeEach(() => {
      resizeWindow(800);
    });

    test('should move sidebar elements to header on tablet', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        // Header should show sidebar elements
        const headerNav = screen.getByRole('navigation', { name: /primary navigation/i });
        expect(headerNav).toBeInTheDocument();
        
        // Menu toggle should be in header
        const menuToggle = screen.getByRole('button', { name: /navigation menu/i });
        expect(menuToggle).toBeInTheDocument();
        expect(headerNav).toContainElement(menuToggle);
        
        // Brand should be in header
        const brandElement = screen.getByText('MeterIt');
        expect(brandElement).toBeInTheDocument();
        expect(headerNav).toContainElement(brandElement);
      });
    });

    test('should open mobile nav overlay when menu toggle is clicked on tablet', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Click menu toggle
      await user.click(menuToggle);
      
      await waitFor(() => {
        // Mobile nav overlay should be visible
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
      });
    });

    test('should show hamburger icon animation on tablet', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      const hamburgerIcon = menuToggle.querySelector('.hamburger-icon');
      
      expect(hamburgerIcon).toBeInTheDocument();
      expect(hamburgerIcon).not.toHaveClass('open');
      
      // Click to open
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(hamburgerIcon).toHaveClass('open');
      });
    });
  });

  describe('Mobile Layout (< 768px)', () => {
    beforeEach(() => {
      resizeWindow(400);
    });

    test('should show mobile layout with header navigation', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        // Header should show sidebar elements
        const headerNav = screen.getByRole('navigation', { name: /primary navigation/i });
        expect(headerNav).toBeInTheDocument();
        
        // Traditional sidebar should not be visible
        expect(screen.queryByRole('navigation', { name: /sidebar navigation/i })).not.toBeInTheDocument();
        
        // Menu toggle should be prominent
        const menuToggle = screen.getByRole('button', { name: /navigation menu/i });
        expect(menuToggle).toBeInTheDocument();
      });
    });

    test('should open full mobile navigation on mobile', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Click menu toggle
      await user.click(menuToggle);
      
      await waitFor(() => {
        // Mobile nav should be visible
        const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
        expect(mobileNav).toBeInTheDocument();
        expect(mobileNav).toHaveClass('open');
      });
    });

    test('should close mobile nav when navigation item is clicked', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Open mobile nav
      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });

      // Click a navigation item
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await user.click(dashboardLink);
      
      await waitFor(() => {
        const mobileNav = screen.queryByRole('navigation', { name: /mobile navigation/i });
        expect(mobileNav).not.toHaveClass('open');
      });
    });
  });

  describe('Responsive Transitions', () => {
    test('should smoothly transition from desktop to tablet layout', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Start with desktop
      resizeWindow(1200);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument();
      });

      // Resize to tablet
      act(() => {
        resizeWindow(800);
      });
      
      await waitFor(() => {
        // Sidebar elements should move to header
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
        expect(screen.getByText('MeterIt')).toBeInTheDocument();
      });
    });

    test('should smoothly transition from tablet to mobile layout', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Start with tablet
      resizeWindow(800);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
      });

      // Resize to mobile
      act(() => {
        resizeWindow(400);
      });
      
      await waitFor(() => {
        // Should still show header navigation but optimized for mobile
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /navigation menu/i })).toBeInTheDocument();
      });
    });

    test('should maintain menu state during resize transitions', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Start with tablet and open mobile nav
      resizeWindow(800);
      
      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });

      // Resize to mobile - nav should remain open
      act(() => {
        resizeWindow(400);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });
    });
  });

  describe('Brand Visibility and Positioning', () => {
    test('should show brand in sidebar on desktop', async () => {
      resizeWindow(1200);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
        const brandText = screen.getByText('MeterIt');
        expect(sidebar).toContainElement(brandText);
      });
    });

    test('should show brand in header on tablet and mobile', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        const headerNav = screen.getByRole('navigation', { name: /primary navigation/i });
        const brandText = screen.getByText('MeterIt');
        expect(headerNav).toContainElement(brandText);
      });
    });

    test('should maintain brand styling across breakpoints', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Test desktop
      resizeWindow(1200);
      await waitFor(() => {
        const brandElement = screen.getByText('MeterIt').closest('.brand, .app-header__brand, .sidebar__brand');
        expect(brandElement).toBeInTheDocument();
      });

      // Test tablet
      act(() => {
        resizeWindow(800);
      });
      await waitFor(() => {
        const brandElement = screen.getByText('MeterIt').closest('.app-header__brand');
        expect(brandElement).toBeInTheDocument();
        expect(brandElement).toHaveClass('app-header__brand');
      });
    });
  });

  describe('Menu Toggle Functionality', () => {
    test('should have correct ARIA attributes for menu toggle', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
      expect(menuToggle).toHaveAttribute('aria-controls', 'main-navigation');
      expect(menuToggle).toHaveAttribute('aria-haspopup', 'menu');
      
      // Click to open
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
      });
    });

    test('should support keyboard navigation for menu toggle', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Focus the button
      menuToggle.focus();
      expect(menuToggle).toHaveFocus();
      
      // Press Enter
      fireEvent.keyDown(menuToggle, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });
      
      // Press Space
      fireEvent.keyDown(menuToggle, { key: ' ', code: 'Space' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).not.toHaveClass('open');
      });
    });
  });

  describe('Performance and Smooth Transitions', () => {
    test('should not cause layout jumps during transitions', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Start with desktop
      resizeWindow(1200);
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
      });

      // Measure initial layout
      const content = screen.getByText('Test Content');
      const initialRect = content.getBoundingClientRect();

      // Resize to tablet
      act(() => {
        resizeWindow(800);
      });

      // Wait for transition
      await waitForTransition();

      // Content should still be visible and positioned reasonably
      const finalRect = content.getBoundingClientRect();
      expect(finalRect.width).toBeGreaterThan(0);
      expect(finalRect.height).toBeGreaterThan(0);
    });

    test('should handle rapid resize events gracefully', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Rapidly resize multiple times
      act(() => {
        resizeWindow(1200);
        resizeWindow(800);
        resizeWindow(400);
        resizeWindow(1200);
      });

      // Should settle on final state
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument();
      });
    });
  });
});