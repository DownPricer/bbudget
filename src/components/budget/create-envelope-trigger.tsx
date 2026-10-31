"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { EnvelopeForm } from "@/components/budget/envelope-form";

export function CreateEnvelopeTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="lg" className="mt-3" onClick={() => setOpen(true)}>
        + Créer une enveloppe
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nouvelle enveloppe">
        <EnvelopeForm onDone={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}
