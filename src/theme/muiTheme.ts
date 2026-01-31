import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2F7E89',
    },
    secondary: {
      main: '#22626B',
    },
    background: {
      default: '#F7F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#667085',
    },
    divider: '#E6E8EC',
    success: {
      main: '#16A34A',
    },
    error: {
      main: '#EF4444',
    },
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontSize: 16,
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default muiTheme;
