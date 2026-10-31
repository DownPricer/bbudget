"use client";

import { useSyncExternalStore } from "react";

const KEY = "bbudget-install-banner-dismissed";
const DISMISS_EVENT = "bbudget-install-dismiss";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readShouldShow(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false;
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    return isIos && !standalone;
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const show = useSyncExternalStore(subscribe, readShouldShow, () => false);

  if (!show) return null;

  return (
    <div className="relative z-30 mx-[18px] mt-2 rounded-[17px] border border-line bg-pale px-4 py-3 text-sm">
      <button
        type="button"
        className="absolute right-1 top-1 touch-target flex h-11 w-11 items-center justify-center rounded-full text-muted"
        aria-label="Fermer"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event(DISMISS_EVENT));
        }}
      >
        ×
      </button>
      <p className="pr-10 font-semibold text-ink">Ajouter à l’écran d’accueil</p>
      <p className="mt-1 text-xs text-muted">iPhone : Partager → Sur l’écran d’accueil</p>
    </div>
  );
}
