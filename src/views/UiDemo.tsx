import { useState } from "react";
import Modal from "../components/ui/Modal";
import LegacySkeleton from "../components/ui/Skeleton";
import ProgressBar from "../components/ui/ProgressBar";
import { useToast as useLegacyToast } from "../components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast as shadcnToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const UiDemo = () => {
  const [isLegacyModalOpen, setLegacyModalOpen] = useState(false);
  const { show } = useLegacyToast();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-foreground">UI Demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comparing existing UI building blocks with shadcn/ui equivalents.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Current UI</h2>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Button</p>
            <button className="primary" type="button">
              Primary action
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Dialog</p>
            <button
              className="primary"
              type="button"
              onClick={() => setLegacyModalOpen(true)}
            >
              Open modal
            </button>
            <Modal
              open={isLegacyModalOpen}
              onClose={() => setLegacyModalOpen(false)}
              title="Legacy modal"
            >
              <p>
                This modal uses the current in-house component styling and
                tokens.
              </p>
            </Modal>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Toast</p>
            <button
              className="primary"
              type="button"
              onClick={() => show("Legacy toast fired!", "success")}
            >
              Show toast
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Skeleton</p>
            <div className="space-y-2">
              <LegacySkeleton height={18} width={180} />
              <LegacySkeleton height={12} width={240} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Progress</p>
            <ProgressBar value={52} max={100} />
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">shadcn/ui</h2>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Button</p>
            <Button>Primary action</Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Dialog</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>shadcn/ui dialog</DialogTitle>
                  <DialogDescription>
                    This dialog uses the new shadcn/ui primitives mapped to the
                    same theme tokens.
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

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Toast</p>
            <Button
              type="button"
              onClick={() =>
                shadcnToast({
                  title: "shadcn/ui toast",
                  description: "Styled with shared theme tokens.",
                })
              }
            >
              Show toast
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Skeleton</p>
            <div className="space-y-2">
              <ShadcnSkeleton className="h-4 w-40" />
              <ShadcnSkeleton className="h-3 w-60" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Progress</p>
            <Progress value={68} />
          </div>
        </section>
      </div>

      <Toaster />
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
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import './UiDemo.css';

const UiDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { show } = useToast();

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
        <p className="ui-demo__eyebrow">UI Demo</p>
        <h1>Custom UI Components</h1>
        <p className="ui-demo__subtitle">A quick overview of the current in-app components.</p>
      </header>

      <div className="ui-demo__grid" role="table" aria-label="UI component samples">
        <div className="ui-demo__head" role="rowgroup">
          <div className="ui-demo__cell ui-demo__cell--head" role="columnheader">Component</div>
          <div className="ui-demo__cell ui-demo__cell--head" role="columnheader">Current</div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Modal</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}>
                Open modal
              </button>
              <Modal open={isModalOpen} title="Modal demo" onClose={() => setIsModalOpen(false)}>
                <p style={{ marginTop: 0 }}>
                  This modal uses the shared Modal component with the current theme tokens.
                </p>
                <div className="ui-demo__inline">
                  <button className="btn btn-outline" type="button" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </Modal>
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">ToastProvider</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__inline">
              <button className="btn btn-primary" type="button" onClick={() => show('Success toast fired', 'success')}>
                Success
              </button>
              <button className="btn btn-outline" type="button" onClick={() => show('Something went wrong', 'error')}>
                Error
              </button>
              <button className="btn btn-outline" type="button" onClick={() => show('Heads up: info toast', 'info')}>
                Info
              </button>
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Skeleton</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <Skeleton height={18} width="70%" />
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="60%" />
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">ProgressBar</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__stack">
              <ProgressBar label="Weekly progress" value={42} max={100} />
              <ProgressBar label="Monthly goal" value={68} max={100} />
            </div>
          </div>
        </div>

        <div className="ui-demo__row" role="row">
          <div className="ui-demo__cell ui-demo__cell--label" role="cell">Buttons</div>
          <div className="ui-demo__cell" role="cell">
            <div className="ui-demo__inline">
              <button className="btn btn-primary" type="button">
                Primary action
              </button>
              <button className="btn btn-outline" type="button">
                Secondary action
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UiDemo = () => <UiDemoContent />;

export default UiDemo;
