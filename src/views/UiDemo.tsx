import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Skeleton as MuiSkeleton,
  Snackbar,
  Stack,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import muiTheme from '../theme/muiTheme';
import './UiDemo.css';

const UiDemoContent = () => {
  const { show } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [muiDialogOpen, setMuiDialogOpen] = useState(false);
  const [muiSnackbarOpen, setMuiSnackbarOpen] = useState(false);

  return (
    <div className="ui-demo">
      <header className="ui-demo__header">
        <h1>UI Demo</h1>
        <p>Side-by-side comparison of core UI primitives and their MUI equivalents.</p>
      </header>

      <div className="ui-demo__columns">
        <section className="ui-demo__column">
          <h2>Current UI</h2>

          <div className="ui-demo__section">
            <h3>Dialog</h3>
            <button onClick={() => setDialogOpen(true)} type="button">
              Open dialog
            </button>
            <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Custom dialog">
              <p>This dialog uses the existing modal component.</p>
              <div className="ui-demo__button-row">
                <button onClick={() => setDialogOpen(false)} type="button">
                  Close
                </button>
                <button className="primary" onClick={() => setDialogOpen(false)} type="button">
                  Confirm
                </button>
              </div>
            </Modal>
          </div>

          <div className="ui-demo__section">
            <h3>Snackbar</h3>
            <button onClick={() => show('Custom toast notification')} type="button">
              Show toast
            </button>
          </div>

          <div className="ui-demo__section">
            <h3>Skeleton</h3>
            <Skeleton height={16} width="80%" />
            <Skeleton height={36} width="100%" style={{ marginTop: 12 }} />
            <Skeleton height={120} radius={12} style={{ marginTop: 12 }} />
          </div>

          <div className="ui-demo__section">
            <h3>Linear Progress</h3>
            <ProgressBar value={62} max={100} label="Syncing entries" />
          </div>

          <div className="ui-demo__section">
            <h3>Buttons</h3>
            <div className="ui-demo__button-row">
              <button type="button">Secondary</button>
              <button className="primary" type="button">
                Primary
              </button>
            </div>
          </div>
        </section>

        <ThemeProvider theme={muiTheme}>
          <section className="ui-demo__column">
            <h2>MUI</h2>

            <div className="ui-demo__section">
              <h3>Dialog</h3>
              <Button variant="outlined" onClick={() => setMuiDialogOpen(true)}>
                Open dialog
              </Button>
              <Dialog open={muiDialogOpen} onClose={() => setMuiDialogOpen(false)}>
                <DialogTitle>MUI dialog</DialogTitle>
                <DialogContent dividers>
                  <p>This dialog uses Material UI components.</p>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setMuiDialogOpen(false)}>Close</Button>
                  <Button variant="contained" onClick={() => setMuiDialogOpen(false)}>
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>
            </div>

            <div className="ui-demo__section">
              <h3>Snackbar</h3>
              <Button variant="outlined" onClick={() => setMuiSnackbarOpen(true)}>
                Show snackbar
              </Button>
              <Snackbar
                open={muiSnackbarOpen}
                onClose={() => setMuiSnackbarOpen(false)}
                message="MUI snackbar notification"
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              />
            </div>

            <div className="ui-demo__section">
              <h3>Skeleton</h3>
              <MuiSkeleton variant="text" width="80%" />
              <MuiSkeleton variant="rectangular" height={36} style={{ marginTop: 12 }} />
              <MuiSkeleton variant="rounded" height={120} style={{ marginTop: 12, borderRadius: 12 }} />
            </div>

            <div className="ui-demo__section">
              <h3>Linear Progress</h3>
              <LinearProgress variant="determinate" value={62} />
            </div>

            <div className="ui-demo__section">
              <h3>Buttons</h3>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined">Secondary</Button>
                <Button variant="contained">Primary</Button>
              </Stack>
            </div>
          </section>
        </ThemeProvider>
      </div>
    </div>
  );
};

const UiDemo = () => <UiDemoContent />;

export default UiDemo;
