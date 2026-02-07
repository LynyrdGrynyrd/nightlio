import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

type ToastState = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastActionType =
  | {
    type: "ADD_TOAST";
    toast: ToastState;
  }
  | {
    type: "UPDATE_TOAST";
    toast: Partial<ToastState>;
  }
  | {
    type: "DISMISS_TOAST";
    toastId?: ToastState["id"];
  }
  | {
    type: "REMOVE_TOAST";
    toastId?: ToastState["id"];
  };

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: ToastState[], action: ToastActionType) => {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);

    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      );

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return state.map((t) =>
        t.id === toastId || toastId === undefined
          ? {
            ...t,
            open: false,
          }
          : t
      );
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return [];
      }
      return state.filter((t) => t.id !== action.toastId);

    default:
      return state;
  }
};

const listeners: Array<(state: ToastState[]) => void> = [];

let memoryState: ToastState[] = [];

const dispatch = (action: ToastActionType) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

type Toast = Omit<ToastState, "id">;

function toast({ ...props }: Toast) {
  const id = crypto.randomUUID();

  const update = (props: ToastState) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<ToastState[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
