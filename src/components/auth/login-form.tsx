"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function rateLimitMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "RATE_LIMITED") {
    return "Trop de tentatives. Réessaie dans 15 minutes.";
  }
  const match = /^RATE_LIMITED:(\d+)$/.exec(code);
  if (match) {
    const minutes = match[1];
    return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes === "1" ? "" : "s"}.`;
  }
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const remember = form.get("remember") === "on";

    try {
      const result = await signIn("credentials", {
        email,
        password,
        remember: String(remember),
        redirect: false,
      });

      if (result?.error) {
        const limited =
          rateLimitMessage(result.code) ??
          rateLimitMessage(result.error) ??
          (result.error.includes("RATE_LIMITED")
            ? rateLimitMessage(
                result.error.match(/RATE_LIMITED(?::\d+)?/)?.[0],
              )
            : null);

        setError(limited ?? "E-mail ou mot de passe incorrect.");
        setPending(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur technique. Réessaie plus tard.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4" data-testid="login-form">
      <Input
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="toi@exemple.com"
      />
      <Input
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />

      <label className="flex min-h-11 items-center gap-3 touch-target cursor-pointer select-none">
        <input
          type="checkbox"
          name="remember"
          className="h-5 w-5 rounded-md border-border text-rose accent-rose"
          defaultChecked
        />
        <span className="text-sm text-foreground/80">Rester connectée</span>
      </label>

      {error ? (
        <p
          className="rounded-2xl bg-peche/50 px-4 py-3 text-sm text-foreground"
          role="alert"
          data-testid="login-error"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
