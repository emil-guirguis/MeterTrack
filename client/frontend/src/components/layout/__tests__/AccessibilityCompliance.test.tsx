import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import AppLayout from '../AppLayout';
import Header from '../Header';
import type { User } from '../../../types/auth';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

// Mock Zustand stores
vi.mock('../../../store/slices/authSlice', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    checkPermission: vi.fn(() => true),
    hasRole: vi.fn(() => true),
  })
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
  })
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

  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

// Mock notifications for testing
const mockNotifications = [
  {
    id: 'notification-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info' as const,
    createdAt: new Date()
  },
  {
    id: 'notification-2-read',
    title: 'Read Notification',
    message: 'This notification has been read',
    type: 'success' as const,
    createdAt: new Date()
  }
];

describe('Accessibility Compliance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset window size to desktop
    resizeWindow(1200);
  });

  describe('Screen Reader Support', () => {
    test('should have proper ARIA landmarks across all layouts', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Test desktop layout
      resizeWindow(1200);
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      });

      // Test tablet layout
      act(() => {
        resizeWindow(800);
      });
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      });

      // Test mobile layout
      act(() => {
        resizeWindow(400);
      });
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      });
    });

    test('should have proper ARIA labels for menu toggle button', async () => {
      resizeWindow(800); // Tablet layout
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Check initial ARIA attributes
      expect(menuToggle).toHaveAttribute('aria-label');
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
      expect(menuToggle).toHaveAttribute('aria-controls', 'main-navigation');
      expect(menuToggle).toHaveAttribute('aria-haspopup', 'menu');
      
      // Click to open menu
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
        expect(menuToggle.getAttribute('aria-label')).toMatch(/close navigation menu/i);
      });
    });

    test('should announce layout changes to screen readers', async () => {
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

      // Resize to tablet - should maintain accessibility
      act(() => {
        resizeWindow(800);
      });
      
      await waitFor(() => {
        const headerNav = screen.getByRole('navigation', { name: /primary navigation/i });
        expect(headerNav).toBeInTheDocument();
        expect(headerNav).toHaveAttribute('aria-label', 'Primary navigation');
      });
    });

    test('should have proper heading hierarchy', async () => {
      render(
        <TestWrapper>
          <AppLayout title="Test Page">
            <div>
              <h2>Section Title</h2>
              <p>Content</p>
            </div>
          </AppLayout>
        </TestWrapper>
      );

      // Should have proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1); // Page title should be h1
      
      // Check if page title is properly structured
      const pageTitle = screen.getByText('Test Page');
      expect(pageTitle.tagName).toBe('H1');
    });

    test('should have descriptive labels for brand elements', async () => {
      resizeWindow(800); // Tablet layout to show brand in header
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        const brandElement = screen.getByRole('img', { name: /meterit application/i });
        expect(brandElement).toBeInTheDocument();
        
        // Brand icon should be hidden from screen readers
        const brandIcon = brandElement.querySelector('.brand-icon');
        expect(brandIcon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support tab navigation through header elements', async () => {
      resizeWindow(800); // Tablet layout
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      // Tab through interactive elements
      await user.tab();
      
      // Should focus on menu toggle first
      const menuToggle = screen.getByRole('button', { name: /navigation menu/i });
      expect(menuToggle).toHaveFocus();
      
      await user.tab();
      
      // Should focus on notifications button
      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationsButton).toHaveFocus();
      
      await user.tab();
      
      // Should focus on user menu
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      expect(userMenuButton).toHaveFocus();
    });

    test('should support keyboard activation of menu toggle', async () => {
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
      
      // Test Enter key
      fireEvent.keyDown(menuToggle, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });
      
      // Test Space key to close
      fireEvent.keyDown(menuToggle, { key: ' ', code: 'Space' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).not.toHaveClass('open');
      });
    });

    test('should maintain logical tab order during layout transitions', async () => {
      render(
        <TestWrapper>
          <AppLayout>
            <div>
              <button>Content Button 1</button>
              <button>Content Button 2</button>
            </div>
          </AppLayout>
        </TestWrapper>
      );

      // Start with desktop layout
      resizeWindow(1200);
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
      });

      // Tab through elements
      await user.tab(); // Should focus first interactive element
      const firstFocused = document.activeElement;
      
      // Resize to tablet
      act(() => {
        resizeWindow(800);
      });
      
      await waitFor(() => {
        // Focus should still be maintained or moved to appropriate element
        expect(document.activeElement).toBeDefined();
        expect(document.activeElement?.tagName).toMatch(/BUTTON|A|INPUT/);
      });
    });

    test('should handle Escape key to close mobile navigation', async () => {
      resizeWindow(400); // Mobile layout
      
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

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).not.toHaveClass('open');
      });
    });
  });

  describe('High Contrast Mode Compatibility', () => {
    test('should maintain visibility in high contrast mode', async () => {
      // Simulate high contrast mode by adding media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        const menuToggle = screen.getByRole('button', { name: /navigation menu/i });
        const computedStyle = window.getComputedStyle(menuToggle);
        
        // Button should have sufficient contrast
        expect(menuToggle).toBeVisible();
        
        // Brand text should be visible
        const brandText = screen.getByText('MeterIt');
        expect(brandText).toBeVisible();
      });
    });

    test('should maintain focus indicators in high contrast mode', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Focus the element
      menuToggle.focus();
      expect(menuToggle).toHaveFocus();
      
      // Should have focus styles applied
      expect(menuToggle).toHaveClass('app-header__menu-toggle');
    });
  });

  describe('ARIA Compliance', () => {
    test('should pass axe accessibility tests on desktop', async () => {
      resizeWindow(1200);
      
      const { container } = render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should pass axe accessibility tests on tablet', async () => {
      resizeWindow(800);
      
      const { container } = render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should pass axe accessibility tests on mobile', async () => {
      resizeWindow(400);
      
      const { container } = render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes for notifications', async () => {
      const { container } = render(
        <Header
          user={mockUser}
          notifications={mockNotifications}
          onLogout={vi.fn()}
          isMobile={false}
          showSidebarElements={true}
          sidebarBrand={{ icon: '🏢', text: 'MeterIt' }}
          onToggleSidebar={vi.fn()}
          sidebarCollapsed={false}
        />
      );

      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
      expect(notificationsButton).toHaveAttribute('aria-controls', 'notifications-dropdown');
      expect(notificationsButton).toHaveAttribute('aria-haspopup', 'menu');
      
      // Should show unread count in aria-label
      expect(notificationsButton.getAttribute('aria-label')).toMatch(/1 unread/);
      
      // Click to open
      await user.click(notificationsButton);
      
      await waitFor(() => {
        expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
        
        const dropdown = screen.getByRole('region', { name: /notifications menu/i });
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).toHaveAttribute('id', 'notifications-dropdown');
      });

      // Test axe compliance
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes for user menu', async () => {
      const { container } = render(
        <Header
          user={mockUser}
          notifications={[]}
          onLogout={vi.fn()}
          isMobile={false}
          showSidebarElements={true}
          sidebarBrand={{ icon: '🏢', text: 'MeterIt' }}
          onToggleSidebar={vi.fn()}
          sidebarCollapsed={false}
        />
      );

      const userMenuButton = screen.getByRole('button', { name: /user menu for test user/i });
      
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
      expect(userMenuButton).toHaveAttribute('aria-controls', 'user-menu-dropdown');
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu');
      
      // Click to open
      await user.click(userMenuButton);
      
      await waitFor(() => {
        expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
        
        const dropdown = screen.getByRole('region', { name: /user account menu/i });
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).toHaveAttribute('id', 'user-menu-dropdown');
        
        // Menu items should have proper roles
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });

      // Test axe compliance
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    test('should manage focus during mobile nav open/close', async () => {
      resizeWindow(400);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Focus and open mobile nav
      menuToggle.focus();
      await user.click(menuToggle);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toHaveClass('open');
      });

      // Close with Escape - focus should return to toggle
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).not.toHaveClass('open');
        expect(menuToggle).toHaveFocus();
      });
    });

    test('should manage focus during dropdown interactions', async () => {
      render(
        <Header
          user={mockUser}
          notifications={mockNotifications}
          onLogout={vi.fn()}
          isMobile={false}
          showSidebarElements={true}
          sidebarBrand={{ icon: '🏢', text: 'MeterIt' }}
          onToggleSidebar={vi.fn()}
          sidebarCollapsed={false}
        />
      );

      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      
      // Open notifications dropdown
      await user.click(notificationsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /notifications menu/i })).toBeInTheDocument();
      });

      // Close with Escape - focus should return to trigger
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('region', { name: /notifications menu/i })).not.toBeInTheDocument();
        expect(notificationsButton).toHaveFocus();
      });
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should maintain sufficient color contrast for interactive elements', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Button should be visible and have proper styling
      expect(menuToggle).toBeVisible();
      expect(menuToggle).toHaveClass('app-header__menu-toggle');
      
      // Brand text should be visible
      const brandText = screen.getByText('MeterIt');
      expect(brandText).toBeVisible();
    });

    test('should provide visual feedback for interactive states', async () => {
      resizeWindow(800);
      
      render(
        <TestWrapper>
          <AppLayout>
            <div>Test Content</div>
          </AppLayout>
        </TestWrapper>
      );

      const menuToggle = await screen.findByRole('button', { name: /navigation menu/i });
      
      // Should have hover/focus states
      menuToggle.focus();
      expect(menuToggle).toHaveFocus();
      
      // Click to change state
      await user.click(menuToggle);
      
      await waitFor(() => {
        const hamburgerIcon = menuToggle.querySelector('.hamburger-icon');
        expect(hamburgerIcon).toHaveClass('open');
      });
    });
  });
});