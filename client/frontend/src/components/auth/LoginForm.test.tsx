import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import authService from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    storeTokens: vi.fn(),
    verify2FA: vi.fn(),
  },
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  describe('Forgot Password Link', () => {
    it('should display "Forgot Password?" link', () => {
      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should navigate to forgot-password page when link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const resetPasswordLink = screen.getByRole('button', { name: /reset password/i });
      await user.click(resetPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('2FA Challenge Display', () => {
    it('should show 2FA modal when login requires 2FA', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'totp' as const,
      };
      (authService.login as any).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });
    });

    it('should display correct 2FA method in modal', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'email_otp' as const,
      };
      (authService.login as any).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Email')).toBeInTheDocument();
      });
    });

    it('should disable form fields when 2FA is required', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'totp' as const,
      };
      (authService.login as any).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i }) as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(emailInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(signInButton.disabled).toBe(true);
      });
    });
  });

  describe('2FA Verification Flow', () => {
    it('should handle successful 2FA verification', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'totp' as const,
      };
      const mockVerifyResponse = {
        token: 'auth-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        user: {
          users_id: '1',
          email: 'test@example.com',
          name: 'Test User',
          client: 'tenant-1',
          role: 'admin',
          permissions: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      (authService.login as any).mockResolvedValue(mockLoginResponse);
      (authService.verify2FA as any).mockResolvedValue(mockVerifyResponse);

      render(
        <BrowserRouter>
          <LoginForm onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(authService.storeTokens).toHaveBeenCalledWith(
          'auth-token',
          'refresh-token',
          3600,
          false
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should store tenant ID after successful 2FA verification', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'totp' as const,
      };
      const mockVerifyResponse = {
        token: 'auth-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        user: {
          users_id: '1',
          email: 'test@example.com',
          name: 'Test User',
          client: 'tenant-123',
          role: 'admin',
          permissions: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      (authService.login as any).mockResolvedValue(mockLoginResponse);
      (authService.verify2FA as any).mockResolvedValue(mockVerifyResponse);

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(localStorage.getItem('tenantId')).toBe('tenant-123');
      });
    });

    it('should close 2FA modal when verification is cancelled', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        requires_2fa: true,
        session_token: 'test-session-token',
        twofa_method: 'totp' as const,
      };
      (authService.login as any).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Two-Factor Authentication')).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Without 2FA', () => {
    it('should proceed with normal login when 2FA is not required', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        requires_2fa: false,
        user: {
          users_id: '1',
          email: 'test@example.com',
          name: 'Test User',
          client: 'tenant-1',
          role: 'admin',
          permissions: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'auth-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };
      (authService.login as any).mockResolvedValue(mockResponse);

      render(
        <BrowserRouter>
          <LoginForm onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });
});
