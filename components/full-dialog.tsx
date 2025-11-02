// /components/full-dialog.tsx
// Custom Full-Screen Dialog Component
// Purpose: Overrides shadcn Dialog's default max-width to support full-screen dialogs for fintech UI
// Usage: Import this instead of regular Dialog for transaction dialogs

"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * FullScreenDialogContent - Dialog content that takes up most of the viewport
 *
 * Key Features:
 * - Uses 95% of viewport width (w-[95vw])
 * - Uses 90% of viewport height (h-[90vh])
 * - Max width of 6xl (72rem/1152px) for large screens
 * - Solid background with proper borders
 * - Fixed header and footer with scrollable content
 *
 * Differences from standard Dialog:
 * - Removes sm:max-w-lg constraint
 * - Adds full viewport sizing
 * - Optimized for transaction/action dialogs
 */
const FullScreenDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="dialog-overlay" />{" "}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-[50%] left-[50%] z-50 w-[95vw] h-[90vh] max-w-6xl",
        "translate-x-[-50%] translate-y-[-50%]",
        "dialog-content-solid rounded-lg shadow-2xl",
        // Flex layout for fixed header/footer
        "flex flex-col overflow-hidden",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
FullScreenDialogContent.displayName = "FullScreenDialogContent";

// Export everything needed for full-screen dialogs
export {
  Dialog as FullScreenDialog,
  FullScreenDialogContent,
  DialogHeader as FullScreenDialogHeader,
  DialogFooter as FullScreenDialogFooter,
  DialogTitle as FullScreenDialogTitle,
  DialogDescription as FullScreenDialogDescription,
  DialogTrigger as FullScreenDialogTrigger,
  DialogClose as FullScreenDialogClose,
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * BASIC USAGE:
 *
 * import {
 *   FullScreenDialog,
 *   FullScreenDialogContent,
 *   FullScreenDialogHeader,
 *   FullScreenDialogTitle,
 * } from "@/components/ui/full-screen-dialog";
 *
 * function MyDialog() {
 *   return (
 *     <FullScreenDialog open={open} onOpenChange={setOpen}>
 *       <FullScreenDialogContent>
 *         <FullScreenDialogHeader>
 *           <FullScreenDialogTitle>My Dialog</FullScreenDialogTitle>
 *         </FullScreenDialogHeader>
 *
 *         <div className="flex-1 overflow-y-auto p-6">
 *           // Scrollable content here
 *         </div>
 *
 *         <FullScreenDialogFooter>
 *           // Fixed footer buttons
 *         </FullScreenDialogFooter>
 *       </FullScreenDialogContent>
 *     </FullScreenDialog>
 *   );
 * }
 *
 * LAYOUT STRUCTURE:
 *
 * ┌─ FullScreenDialogContent (flex flex-col) ─────────┐
 * │                                                    │
 * │  ┌─ FullScreenDialogHeader (shrink-0) ────┐ │
 * │  │  Fixed Header                               │ │
 * │  └─────────────────────────────────────────────┘ │
 * │                                                    │
 * │  ┌─ Content Area (flex-1 overflow-y-auto) ────┐  │
 * │  │  Scrollable                                 │  │
 * │  │  Content                                    │  │
 * │  │  ...                                        │  │
 * │  └─────────────────────────────────────────────┘  │
 * │                                                    │
 * │  ┌─ FullScreenDialogFooter (shrink-0) ───┐  │
 * │  │  Fixed Footer                               │  │
 * │  └─────────────────────────────────────────────┘  │
 * │                                                    │
 * └────────────────────────────────────────────────────┘
 *
 * KEY STYLING CLASSES:
 * - Container: flex flex-col overflow-hidden (enables fixed header/footer)
 * - Header: No special classes needed, naturally stays at top
 * - Content: flex-1 overflow-y-auto p-6 (grows to fill space, scrolls)
 * - Footer: No special classes needed, naturally stays at bottom
 */
