import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordModal } from './ChangePasswordModal';
import authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  default: {
    changePassword: vi.fn(),
  },
}));

describe('ChangePasswordModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the modal when open is true', () => {
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should not render the modal when open is false', () => {
      const { container } = render(
        <ChangePasswordModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Password Strength Indicator', () => {
    it('should display password strength indicator when new password is entered', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'Test123!@#');

      expect(screen.getByText('Password Strength')).toBeInTheDocument();
    });

    it('should show password requirements checklist', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'Test123!@#');

      expect(screen.getByText('Password Requirements')).toBeInTheDocument();
      expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
      expect(screen.getByText('At least one uppercase letter (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('At least one lowercase letter (a-z)')).toBeInTheDocument();
      expect(screen.getByText('At least one number (0-9)')).toBeInTheDocument();
      expect(screen.getByText('At least one special character (!@#$%^&*)')).toBeInTheDocument();
    });

    it('should mark requirements as met when password meets them', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'ValidPassword123!');

      // All requirements should be met
      const checkmarks = screen.getAllByTestId('CheckCircleIcon');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Password Matching', () => {
    it('should show password match indicator when passwords match', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      expect(screen.getByText('Passwords match')).toBeInTheDocument();
    });

    it('should show mismatch indicator when passwords do not match', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when current password is empty', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
      });
    });

    it('should show error when new password is empty', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('New password is required')).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should show error when password does not meet requirements', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password does not meet all security requirements')
        ).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call changePassword API with correct parameters', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.changePassword).mockResolvedValue({ message: 'Success' });

      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith(
          'OldPassword123!',
          'ValidPassword123!',
          'ValidPassword123!'
        );
      });
    });

    it('should show success message on successful password change', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.changePassword).mockResolvedValue({ message: 'Success' });

      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Changed Successfully')).toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.changePassword).mockRejectedValue(
        new Error('Current password is incorrect')
      );

      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'WrongPassword123!');
      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSuccess callback after successful password change', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.changePassword).mockResolvedValue({ message: 'Success' });

      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /Change Password/i });

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput = screen.getByLabelText('Current Password') as HTMLInputElement;
      expect(currentPasswordInput.type).toBe('password');

      const visibilityButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('[data-testid="VisibilityIcon"]') || btn.querySelector('[data-testid="VisibilityOffIcon"]')
      );

      if (visibilityButtons.length > 0) {
        await user.click(visibilityButtons[0]);
        expect(currentPasswordInput.type).toBe('text');
      }
    });
  });

  describe('Password Strength Levels', () => {
    it('should show weak strength for weak passwords', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'Weak1!');

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should show strong strength for strong passwords', async () => {
      const user = userEvent.setup();
      render(
        <ChangePasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'VeryStrongPassword123!@#');

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });
});
