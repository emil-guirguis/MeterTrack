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
          },
          '& .MuiInputLabel-root': {
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
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
  },
});
