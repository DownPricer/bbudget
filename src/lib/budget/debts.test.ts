import { describe, expect, it } from "vitest";
import { estimatePayoffDate, sortSnowball } from "./debts";
import { isWishReady, wishCountdownMs } from "./wishes";
import { monthlySubscriptionAmount, sumSubscriptionsMonthly } from "./subscriptions";

describe("sortSnowball", () => {
  it("classe la plus petite dette en premier", () => {
    const sorted = sortSnowball([
      { id: "a", creditor: "Banque", remainingAmount: 500, initialAmount: 500, monthlyPayment: 50 },
      { id: "b", creditor: "Amie", remainingAmount: 40, initialAmount: 80, monthlyPayment: 20 },
      { id: "c", creditor: "Payé", remainingAmount: 0, initialAmount: 100, monthlyPayment: 10 },
    ]);
    expect(sorted.map((d) => d.id)).toEqual(["b", "a"]);
  });
});

describe("estimatePayoffDate", () => {
  it("estime la fin selon la mensualité", () => {
    const from = new Date(2026, 0, 1);
    const end = estimatePayoffDate(100, 40, from);
    // ceil(100/40) = 3 mois → 1 avril 2026
    expect(end?.getMonth()).toBe(3);
    expect(end?.getFullYear()).toBe(2026);
  });
});

describe("subscriptions", () => {
  it("ramène annuel et hebdo au mois", () => {
    expect(monthlySubscriptionAmount(120, "ANNUEL")).toBe(10);
    expect(sumSubscriptionsMonthly([
      { amount: 10, frequency: "MENSUEL", status: "ACTIF" },
      { amount: 120, frequency: "ANNUEL", status: "ACTIF" },
      { amount: 5, frequency: "MENSUEL", status: "RESILIE" },
    ])).toBe(20);
  });
});

describe("wishes 48h", () => {
  it("pas prêt avant 48h, prêt après", () => {
    const added = new Date("2026-10-01T10:00:00Z");
    expect(isWishReady(added, new Date("2026-10-02T09:00:00Z"))).toBe(false);
    expect(isWishReady(added, new Date("2026-10-03T10:00:00Z"))).toBe(true);
    expect(wishCountdownMs(added, new Date("2026-10-02T10:00:00Z"))).toBe(24 * 60 * 60 * 1000);
  });
});
