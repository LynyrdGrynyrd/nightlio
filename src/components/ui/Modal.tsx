/**
 * Modal - Backwards-compatible wrapper around shadcn Dialog
 * 
 * This component maintains the existing Modal API (open, onClose, title, children)
 * while internally using shadcn/ui Dialog primitives.
 * 
 * For new code, prefer using Dialog components directly:
 * import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 */
import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: number;
  className?: string;
}

const Modal = ({
  open,
  title,
  children,
  onClose,
  maxWidth = 520,
  className
}: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn("sm:max-w-[520px]", className)}
        style={{ maxWidth: maxWidth }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
