"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddSheet, type QuickEnvelope } from "./quick-add-sheet";

type FabProps = {
  envelopes: QuickEnvelope[];
};

export function Fab({ envelopes }: FabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-lg shadow-rose/40 transition-transform active:scale-95"
        style={{
          right: "calc(1rem + var(--safe-right))",
          bottom: "calc(var(--tab-bar-height) + var(--safe-bottom) + 1rem)",
        }}
        aria-label="Ajouter une dépense ou une rentrée"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <QuickAddSheet open={open} onClose={() => setOpen(false)} envelopes={envelopes} />
    </>
  );
}
