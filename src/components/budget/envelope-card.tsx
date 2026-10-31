"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EnvelopeForm } from "@/components/budget/envelope-form";
import { ListRow } from "@/components/ui/list-row";
import { ProgressTrack } from "@/components/ui/progress-track";
import { formatEuro } from "@/lib/utils";
import type { EnvelopeStatus } from "@/lib/budget";

type EnvelopeCardProps = {
  envelope: EnvelopeStatus;
  href?: string;
};

export function EnvelopeCard({ envelope, href }: EnvelopeCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const over = envelope.isOver;
  const value = over
    ? `${formatEuro(Math.abs(envelope.remaining))} au-delà`
    : formatEuro(Math.max(0, envelope.remaining));

  const row = (
    <ListRow
      icon={envelope.emoji}
      title={envelope.name}
      subtitle={`${formatEuro(envelope.spent)} / ${formatEuro(envelope.monthlyAmount)}`}
      value={value}
      footer={
        <>
          <ProgressTrack
            progress={envelope.progress}
            color={over ? "var(--peach-gauge)" : envelope.color}
          />
          {over ? (
            <p className="mt-2 text-[11px] text-[#C9956C]">Enveloppe dépassée</p>
          ) : null}
        </>
      }
    />
  );

  if (href) {
    return (
      <Link href={href} className="block min-h-11 touch-target">
        {row}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="block w-full min-h-11 touch-target text-left"
        onClick={() => setEditOpen(true)}
      >
        {row}
      </button>
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier l’enveloppe"
      >
        <EnvelopeForm
          initial={{
            id: envelope.id,
            name: envelope.name,
            emoji: envelope.emoji,
            color: envelope.color,
            monthlyAmount: envelope.monthlyAmount,
          }}
          onDone={() => setEditOpen(false)}
        />
      </BottomSheet>
    </>
  );
}
