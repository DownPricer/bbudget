"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  abandonChallenge,
  markChallengeDay,
  startChallenge,
} from "@/app/actions/challenges";
import { CHALLENGE_TEMPLATES, TIPS } from "@/lib/tips";

type Challenge = {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  progressDays: number;
  status: string;
};

export function ChallengesClient({ challenges }: { challenges: Challenge[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = challenges.filter((c) => c.status === "ACTIF");
  const done = challenges.filter((c) => c.status === "TERMINE");

  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-3">
        <h2 className="font-bold">Astuces</h2>
        {TIPS.map((tip) => (
          <Card key={tip.title}>
            <CardTitle className="text-base">{tip.title}</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{tip.body}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">Défis</h2>
        {active.map((c) => (
          <Card key={c.id} className="space-y-3">
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-muted">{c.description}</p>
              <p className="mt-2 text-sm">
                Jour {c.progressDays}/{c.durationDays}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-soft">
                <div
                  className="h-full rounded-full bg-rose"
                  style={{
                    width: `${Math.min(100, (c.progressDays / c.durationDays) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markChallengeDay(c.id);
                    router.refresh();
                  })
                }
              >
                Valider le jour
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await abandonChallenge(c.id);
                    router.refresh();
                  })
                }
              >
                Stop
              </Button>
            </div>
          </Card>
        ))}

        {done.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#5a9e8a]">Badges obtenus</p>
            {done.map((c) => (
              <p
                key={c.id}
                className="rounded-2xl bg-menthe/40 px-4 py-3 text-sm font-semibold"
              >
                {c.title}
              </p>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-muted">Lancer un défi :</p>
          {CHALLENGE_TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              disabled={pending}
              className="flex w-full flex-col rounded-3xl border border-border/60 bg-card px-4 py-3 text-left touch-target"
              onClick={() =>
                startTransition(async () => {
                  await startChallenge(t);
                  router.refresh();
                })
              }
            >
              <span className="font-semibold">{t.title}</span>
              <span className="text-xs text-muted">
                {t.durationDays} jour{t.durationDays > 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
