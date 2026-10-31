"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { HeroDark } from "@/components/ui/hero-dark";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { StatTile } from "@/components/ui/stat-tile";
import { createWishItem, decideWishItem } from "@/app/actions/wishes";
import {
  formatCountdown,
  isWishReady,
  wishCountdownMs,
} from "@/lib/budget/wishes";
import { formatEuro } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Wish = {
  id: string;
  name: string;
  price: number;
  link?: string | null;
  photoUrl?: string | null;
  envelopeId?: string | null;
  envelopeName?: string | null;
  envelopeBudget?: number | null;
  envelopeSpent?: number | null;
  addedAt: string;
  status: "EN_ATTENTE" | "ACHETE" | "ABANDONNE";
};

type Envelope = { id: string; name: string; emoji: string };

export function WishListClient({
  wishes,
  envelopes,
  savedTotal,
}: {
  wishes: Wish[];
  envelopes: Envelope[];
  savedTotal: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [envelopeId, setEnvelopeId] = useState(envelopes[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const pendingItems = wishes.filter((w) => w.status === "EN_ATTENTE");
  const history = wishes.filter((w) => w.status !== "EN_ATTENTE");

  function wouldOverspend(w: Wish) {
    if (w.envelopeBudget == null || w.envelopeSpent == null) return false;
    return w.envelopeSpent + w.price > w.envelopeBudget;
  }

  return (
    <div>
      <HeroDark
        label="Avant d’acheter"
        value="48 h"
        hint="Ajoute une envie, puis décide après deux jours."
      />

      <StatTile
        label="Économisé grâce aux envies abandonnées"
        value={formatEuro(savedTotal)}
        tone="mint"
        className="mb-4"
      />

      <section>
        <h2 className="mb-3 text-base font-bold text-ink">En attente</h2>
        {pendingItems.length === 0 ? (
          <p className="rounded-[19px] border border-line bg-white p-[15px] text-[11px] text-muted">
            Aucun coup de cœur en attente.
          </p>
        ) : (
          pendingItems.map((w) => {
            const added = new Date(w.addedAt);
            const ready = isWishReady(added, now);
            const over = wouldOverspend(w);
            return (
              <ListRow
                key={w.id}
                icon={w.photoUrl ? undefined : "♡"}
                title={w.name}
                subtitle={
                  ready
                    ? `${w.envelopeName ?? "Sans enveloppe"} · prêt à décider`
                    : `${w.envelopeName ?? "Sans enveloppe"} · ${formatCountdown(wishCountdownMs(added, now))}`
                }
                value={formatEuro(w.price)}
                footer={
                  <>
                    {over ? (
                      <p className="mt-2 text-[11px] text-[#C9956C]">
                        Cet achat dépasserait l’enveloppe liée.
                      </p>
                    ) : null}
                    {ready ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <Button
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await decideWishItem({
                                id: w.id,
                                decision: "ACHETE",
                              });
                              if (!r.ok) setMsg(r.error);
                              else {
                                setMsg("Achat enregistré");
                                router.refresh();
                              }
                            })
                          }
                        >
                          Acheté
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await decideWishItem({
                                id: w.id,
                                decision: "ABANDONNE",
                              });
                              if (!r.ok) setMsg(r.error);
                              else {
                                setMsg(
                                  `Économisé ${formatEuro(r.saved ?? w.price)}`,
                                );
                                router.refresh();
                              }
                            })
                          }
                        >
                          Abandonné
                        </Button>
                      </div>
                    ) : null}
                  </>
                }
              />
            );
          })
        )}
      </section>

      <Button type="button" size="lg" className="mt-3" onClick={() => setOpen(true)}>
        + Ajouter un coup de cœur
      </Button>
      {msg ? <p className="mt-2 text-sm text-rose-deep">{msg}</p> : null}

      {history.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-ink">Historique</h2>
          {history.map((w) => (
            <ListRow
              key={w.id}
              icon="♡"
              title={w.name}
              subtitle={w.status === "ABANDONNE" ? "Abandonné" : "Acheté"}
              value={formatEuro(w.price)}
            />
          ))}
        </section>
      ) : null}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nouveau coup de cœur">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const r = await createWishItem({
                name,
                price,
                link: link || undefined,
                envelopeId: envelopeId || undefined,
              });
              if (!r.ok) setMsg(r.error);
              else {
                setName("");
                setPrice("");
                setLink("");
                setOpen(false);
                setMsg("Ajouté — décision dans 48 h");
                router.refresh();
              }
            });
          }}
        >
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Prix"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label="Lien (optionnel)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
          />
          <div>
            <p className="mb-1.5 text-xs font-bold text-[#746979]">Enveloppe</p>
            <div className="flex flex-wrap gap-2">
              {envelopes.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvelopeId(env.id)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-semibold",
                    envelopeId === env.id
                      ? "border-[#e9abc3] bg-pale text-rose-deep"
                      : "border-line bg-white text-[#756b7b]",
                  )}
                >
                  {env.emoji} {env.name}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
