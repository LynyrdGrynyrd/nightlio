import { useState } from 'react';
import {
  Button as MuiButton,
  Card,
  CardContent,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  LinearProgress,
  Skeleton as MuiSkeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { toast as shadcnToast } from '@/components/ui/use-toast';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import muiTheme from '../theme/muiTheme';
import './UiDemo.css';

const UiDemo = () => {
  const { show } = useToast();
  const [legacyModalOpen, setLegacyModalOpen] = useState(false);
  const [muiDialogOpen, setMuiDialogOpen] = useState(false);
  const [muiSnackbarOpen, setMuiSnackbarOpen] = useState(false);

  return (
    <div className="ui-demo">
      <header className="ui-demo__header">
        <p className="ui-demo__eyebrow">UI Demo</p>
        <h1>Component comparisons</h1>
        <p className="ui-demo__subtitle">
          Side-by-side examples of the current components, MUI, and shadcn/ui.
        </p>
      </header>

      <div className="ui-demo__columns">
        <section className="ui-demo__column">
          <h2>Current UI</h2>

          <div className="ui-demo__section">
            <h3>Buttons</h3>
            <div className="ui-demo__inline">
              <button type="button">Secondary</button>
              <button className="primary" type="button">
                Primary
              </button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Dialog</h3>
            <button
              className="primary"
              type="button"
              onClick={() => setLegacyModalOpen(true)}
            >
              Open dialog
            </button>
            <Modal
              open={legacyModalOpen}
              onClose={() => setLegacyModalOpen(false)}
              title="Custom dialog"
            >
              <p>This dialog uses the existing modal component.</p>
              <div className="ui-demo__inline">
                <button type="button" onClick={() => setLegacyModalOpen(false)}>
                  Close
                </button>
              </div>
            </Modal>
          </div>

          <div className="ui-demo__section">
            <h3>Toast</h3>
            <div className="ui-demo__inline">
              <button type="button" onClick={() => show('Custom toast notification', 'info')}>
                Info toast
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => show('Success toast notification', 'success')}
              >
                Success toast
              </button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Skeleton</h3>
            <div className="ui-demo__stack">
              <Skeleton height={16} width="80%" />
              <Skeleton height={36} width="100%" />
              <Skeleton height={120} radius={12} />
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Progress</h3>
            <ProgressBar value={62} max={100} label="Syncing entries" />
          </div>

          <div className="ui-demo__section">
            <h3>Empty state</h3>
            <EmptyState
              title="No entries yet"
              message="Start journaling to see insights here."
              actionLabel="Create entry"
              onAction={() => show('Create entry clicked', 'info')}
            />
          </div>
        </section>

        <ThemeProvider theme={muiTheme}>
          <section className="ui-demo__column">
            <h2>MUI</h2>

            <div className="ui-demo__section">
              <h3>Buttons</h3>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <MuiButton variant="outlined">Secondary</MuiButton>
                <MuiButton variant="contained">Primary</MuiButton>
              </Stack>
            </div>

            <div className="ui-demo__section">
              <h3>Dialog</h3>
              <MuiButton variant="outlined" onClick={() => setMuiDialogOpen(true)}>
                Open dialog
              </MuiButton>
              <MuiDialog open={muiDialogOpen} onClose={() => setMuiDialogOpen(false)}>
                <MuiDialogTitle>MUI dialog</MuiDialogTitle>
                <MuiDialogContent dividers>
                  <p>This dialog uses Material UI components.</p>
                </MuiDialogContent>
                <DialogActions>
                  <MuiButton onClick={() => setMuiDialogOpen(false)}>Close</MuiButton>
                  <MuiButton variant="contained" onClick={() => setMuiDialogOpen(false)}>
                    Confirm
                  </MuiButton>
                </DialogActions>
              </MuiDialog>
            </div>

            <div className="ui-demo__section">
              <h3>Snackbar</h3>
              <MuiButton variant="outlined" onClick={() => setMuiSnackbarOpen(true)}>
                Show snackbar
              </MuiButton>
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
              <div className="ui-demo__stack">
                <MuiSkeleton variant="text" width="80%" />
                <MuiSkeleton variant="rectangular" height={36} />
                <MuiSkeleton variant="rounded" height={120} />
              </div>
            </div>

            <div className="ui-demo__section">
              <h3>Progress</h3>
              <LinearProgress variant="determinate" value={62} />
            </div>

            <div className="ui-demo__section">
              <h3>Empty state</h3>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    No entries yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start journaling to see insights here.
                  </Typography>
                  <MuiButton variant="contained" size="small">
                    Create entry
                  </MuiButton>
                </CardContent>
              </Card>
            </div>
          </section>
        </ThemeProvider>

        <section className="ui-demo__column">
          <h2>shadcn/ui</h2>

          <div className="ui-demo__section">
            <h3>Buttons</h3>
            <div className="ui-demo__inline">
              <Button variant="secondary">Secondary</Button>
              <Button>Primary</Button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Dialog</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>shadcn/ui dialog</DialogTitle>
                  <DialogDescription>
                    This dialog uses shadcn/ui primitives mapped to shared tokens.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" type="button">
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="ui-demo__section">
            <h3>Toast</h3>
            <Button
              type="button"
              onClick={() =>
                shadcnToast({
                  title: 'shadcn/ui toast',
                  description: 'Styled with the shared theme tokens.',
                })
              }
            >
              Show toast
            </Button>
          </div>

          <div className="ui-demo__section">
            <h3>Skeleton</h3>
            <div className="ui-demo__stack">
              <ShadcnSkeleton className="h-4 w-40" />
              <ShadcnSkeleton className="h-3 w-60" />
              <ShadcnSkeleton className="h-24 w-full" />
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Progress</h3>
            <Progress value={68} />
          </div>

          <div className="ui-demo__section">
            <h3>Empty state</h3>
            <div className="ui-demo__empty">
              <div>
                <p className="ui-demo__empty-title">No entries yet</p>
                <p className="ui-demo__empty-text">Start journaling to see insights here.</p>
              </div>
              <Button size="sm">Create entry</Button>
            </div>
          </div>
        </section>
      </div>

      <Toaster />
    </div>
  );
};

export default UiDemo;
