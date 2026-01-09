import { createTheme } from '@mui/material/styles';

/**
 * Material Design 3 compliant theme for MUI
 * Follows Google's Material Design 3 specifications
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#0056eaff',
    },
    error: {
      main: '#b3261e',
    },
    background: {
      default: '#fffbfe',
      paper: '#fffbfe',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          margin: '0 !important',
          marginBottom: '0 !important',
          marginTop: '0 !important',
          '& .MuiOutlinedInput-root': {
            minHeight: '48px',
            backgroundColor: '#ffffff !important',
            '& input': {
              backgroundColor: '#ffffff !important',
              color: '#000000 !important',
              WebkitTextFillColor: '#000000 !important',
            },
            '& input::placeholder': {
              color: '#999999 !important',
              opacity: 1,
            },
            '& fieldset': {
              borderColor: '#cccccc',
            },
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#666666',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
            '&.Mui-focused': {
              color: '#1976d2',
            },
          },
          // Style date/time input icons to be visible
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            cursor: 'pointer',
            filter: 'invert(0.8)',
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            cursor: 'pointer',
            filter: 'invert(0.8)',
          },
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          margin: '0 !important',
          marginBottom: '0 !important',
          marginTop: '0 !important',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          '& input': {
            backgroundColor: '#ffffff !important',
            color: '#000000 !important',
            WebkitTextFillColor: '#000000 !important',
          },
          '& input::placeholder': {
            color: '#999999 !important',
            opacity: 1,
          },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#000000 !important',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#000000 !important',
          },
        },
      },
    },
  },
});
