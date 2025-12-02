import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { LoginCredentials, ValidationError } from '../../types/auth';
import { validateLoginCredentials } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo = '/dashboard' }) => {
  const { login, isLoading, error } = useAuth();

  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear validation errors when user starts typing
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [credentials.email, credentials.password]);

  // Handle input changes
  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate form
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      await login(credentials);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect behavior
        window.location.href = redirectTo;
      }
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field error message
  const getFieldError = (field: string): string | undefined => {
    const fieldError = validationErrors.find(error => error.field === field);
    return fieldError?.message;
  };

  // Check if field has error
  const hasFieldError = (field: string): boolean => {
    return validationErrors.some(error => error.field === field);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to access your account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                type="email"
                value={credentials.email}
                onChange={handleInputChange('email')}
                error={hasFieldError('email')}
                helperText={getFieldError('email')}
                disabled={isSubmitting || isLoading}
                InputLabelProps={{
                  shrink: credentials.email.length > 0 || undefined,
                }}
                sx={{ mb: 2 }}
              />

              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                id="password"
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleInputChange('password')}
                error={hasFieldError('password')}
                helperText={getFieldError('password')}
                disabled={isSubmitting || isLoading}
                InputLabelProps={{
                  shrink: credentials.password.length > 0 || undefined,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isSubmitting || isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              {/* Remember Me Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={credentials.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    name="rememberMe"
                    color="primary"
                    disabled={isSubmitting || isLoading}
                  />
                }
                label="Remember me"
                sx={{ mb: 2 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || isLoading}
                sx={{
                  mt: 2,
                  mb: 2,
                  height: 48,
                  position: 'relative',
                }}
              >
                {(isSubmitting || isLoading) && (
                  <CircularProgress
                    size={20}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      marginLeft: '-10px',
                      marginTop: '-10px',
                    }}
                  />
                )}
                {(isSubmitting || isLoading) ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Additional Links */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Forgot your password?{' '}
                  <Button
                    variant="text"
                    size="small"
                    disabled={isSubmitting || isLoading}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    Reset Password
                  </Button>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 MeterIt Pro. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;