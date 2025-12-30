import { createTheme } from '@mui/material/styles';

/**
 * Material Design 3 compliant theme for MUI
 * Follows Google's Material Design 3 specifications
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#6200ea',
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
