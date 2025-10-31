// hooks/use-toast.ts
// ============================================================================
// Toast Notification Hook for GALLA.GOLD
// ============================================================================
// Purpose: Manage toast notifications using shadcn/ui toast component
// ✅ FIXED: Module was missing entirely

import * as React from "react";

// Note: This expects @/components/ui/toast to exist with shadcn/ui toast component
// The types are defined here to avoid circular dependencies

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Toast action button element
 */
export type ToastActionElement = React.ReactElement<any>;

/**
 * Toast variants
 */
type ToastVariant = "default" | "destructive";

/**
 * Toast properties
 */
export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Toast state
 */
type Toast = Omit<ToastProps, "id">;

// =============================================================================
// TOAST STATE MANAGEMENT
// =============================================================================

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Toast action types
 */
type Action =
  | {
      type: "ADD_TOAST";
      toast: Toast & { id: string };
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<Toast> & { id: string };
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: string;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };

/**
 * Toast state interface
 */
interface State {
  toasts: (Toast & { id: string })[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Add toast to removal queue
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Toast reducer
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// =============================================================================
// TOAST CONTEXT & LISTENER
// =============================================================================

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

/**
 * Dispatch toast action
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// =============================================================================
// TOAST HOOK
// =============================================================================

/**
 * useToast hook
 * 
 * Usage:
 * ```tsx
 * const { toast } = useToast();
 * 
 * toast({
 *   title: "Success!",
 *   description: "Your action was completed.",
 * });
 * 
 * toast({
 *   variant: "destructive",
 *   title: "Error",
 *   description: "Something went wrong.",
 * });
 * ```
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

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
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// =============================================================================
// TOAST FUNCTION
// =============================================================================

/**
 * Toast function to show notifications
 * 
 * @param props - Toast properties
 * @returns Object with id and dismiss/update methods
 * 
 * @example
 * ```tsx
 * // Simple toast
 * toast({ title: "Success!" });
 * 
 * // Toast with description
 * toast({
 *   title: "Purchase Complete",
 *   description: "You bought 10g of gold.",
 * });
 * 
 * // Error toast
 * toast({
 *   variant: "destructive",
 *   title: "Error",
 *   description: "Transaction failed.",
 * });
 * 
 * // Toast with action
 * toast({
 *   title: "Email Sent",
 *   action: <Button onClick={undo}>Undo</Button>,
 * });
 * 
 * // Custom duration
 * toast({
 *   title: "Quick Message",
 *   duration: 2000, // 2 seconds
 * });
 * ```
 */
function toast(props: Toast) {
  const id = genId();

  const update = (props: Toast) =>
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique toast ID
 */
function genId() {
  return Math.random().toString(36).substring(2, 9);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { useToast, toast };

// =============================================================================
// USAGE NOTES
// =============================================================================
//
// This hook works with the shadcn/ui Toast component.
// Make sure you have installed:
// - @/components/ui/toast
// - @/components/ui/toaster
//
// Add <Toaster /> to your root layout:
// ```tsx
// import { Toaster } from "@/components/ui/toaster";
//
// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         {children}
//         <Toaster />
//       </body>
//     </html>
//   );
// }
// ```
//
// Then use in any component:
// ```tsx
// import { useToast } from "@/hooks/use-toast";
//
// export function MyComponent() {
//   const { toast } = useToast();
//
//   const handleClick = () => {
//     toast({
//       title: "Gold Purchased!",
//       description: "Successfully bought 5g of gold.",
//     });
//   };
//
//   return <Button onClick={handleClick}>Buy Gold</Button>;
// }
// ```
//
