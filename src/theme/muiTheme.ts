import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'var(--accent-600)',
    },
    secondary: {
      main: 'var(--accent-700)',
    },
    background: {
      default: 'var(--bg)',
      paper: 'var(--surface)',
    },
    text: {
      primary: 'var(--text)',
      secondary: 'var(--text-muted)',
    },
    divider: 'var(--border)',
    success: {
      main: 'var(--success)',
    },
    error: {
      main: 'var(--danger)',
    },
  },
  typography: {
    fontFamily: 'var(--font-family)',
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
      fontSize: 'var(--font-size-base)',
      lineHeight: 'var(--line-height-base)',
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
