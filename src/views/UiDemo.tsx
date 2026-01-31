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
    </div>
  );
};

export default UiDemo;
