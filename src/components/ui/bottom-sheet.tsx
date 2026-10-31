"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-[#30283d80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title ?? "Formulaire"}
            className={cn(
              "relative z-10 max-h-[90dvh] w-full max-w-[var(--app-max)] overflow-y-auto rounded-t-[25px] bg-background p-5",
              className,
            )}
            style={{ paddingBottom: "calc(1.25rem + var(--safe-bottom))" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="touch-target float-right grid h-11 w-11 place-items-center rounded-full bg-white text-xl text-muted"
              aria-label="Fermer"
            >
              ×
            </button>
            {title ? <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2> : null}
            <div className="clear-both">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
