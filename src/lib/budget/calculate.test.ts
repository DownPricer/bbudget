import { describe, expect, it } from "vitest";
import {
  allocateAvailable,
  calculateCurrentBalance,
  calculateSpendableDashboard,
  hasBillingDayOccurred,
  noIncomeMessage,
  tightMonthMessage,
  type EnvelopeSnapshot,
} from "./calculate";
import { getBudgetPeriod, isInPeriod } from "./period";

const allocation = { pleasurePercent: 60, savingsPercent: 25, debtBonusPercent: 15 };

const pleasureEnvelopes: EnvelopeSnapshot[] = [
  {
    id: "1",
    name: "Fringues",
    emoji: "👗",
    color: "#F8C8DC",
    type: "PLAISIR",
    monthlyAmount: 80,
    spent: 30,
  },
  {
    id: "2",
    name: "Sorties",
    emoji: "🍹",
    color: "#B8E0D2",
    type: "PLAISIR",
    monthlyAmount: 60,
    spent: 20,
  },
];

const periodStart = new Date(2026, 9, 1); // 1 oct
const periodEnd = new Date(2026, 9, 31, 23, 59, 59, 999);

function baseInput(
  overrides: Partial<Parameters<typeof calculateSpendableDashboard>[0]> = {},
) {
  return {
    openingBalance: 500,
    incomesSinceOpening: 0,
    expensesSinceOpening: 0,
    today: new Date(2026, 9, 15),
    periodStart,
    periodEnd,
    subscriptions: [] as Parameters<typeof calculateSpendableDashboard>[0]["subscriptions"],
    debts: [] as Parameters<typeof calculateSpendableDashboard>[0]["debts"],
    envelopes: pleasureEnvelopes,
    incomesTotal: 550,
    allocation,
    ...overrides,
  };
}

describe("getBudgetPeriod", () => {
  it("mois calendaire classique (début le 1)", () => {
    const period = getBudgetPeriod(new Date(2026, 9, 15), 1);
    expect(period.start.getDate()).toBe(1);
    expect(period.start.getMonth()).toBe(9);
    expect(period.end.getMonth()).toBe(9);
    expect(period.end.getDate()).toBe(31);
  });

  it("mois budgétaire décalé (début le 25)", () => {
    const period = getBudgetPeriod(new Date(2026, 9, 10), 25);
    expect(period.start.getMonth()).toBe(8);
    expect(period.start.getDate()).toBe(25);
    expect(isInPeriod(new Date(2026, 9, 10), period)).toBe(true);
    expect(isInPeriod(new Date(2026, 8, 24), period)).toBe(false);
  });
});

describe("allocateAvailable", () => {
  it("répartit 60/25/15", () => {
    expect(allocateAvailable(100, allocation)).toEqual({
      pleasure: 60,
      savings: 25,
      debtBonus: 15,
    });
  });

  it("disponible négatif ou nul → zéro partout", () => {
    expect(allocateAvailable(-50, allocation)).toEqual({
      pleasure: 0,
      savings: 0,
      debtBonus: 0,
    });
  });
});

describe("calculateCurrentBalance", () => {
  it("solde à 0", () => {
    expect(calculateCurrentBalance(0, 0, 0)).toBe(0);
  });

  it("solde négatif (découvert)", () => {
    expect(calculateCurrentBalance(-40, 10, 5)).toBe(-35);
  });

  it("ajustement manuel : sans mouvements depuis la référence = solde saisi", () => {
    expect(calculateCurrentBalance(327.45, 0, 0)).toBe(327.45);
  });

  it("mouvements depuis la référence", () => {
    expect(calculateCurrentBalance(200, 50, 30)).toBe(220);
  });
});

describe("hasBillingDayOccurred", () => {
  it("jour de prélèvement déjà passé ce mois", () => {
    expect(
      hasBillingDayOccurred(5, periodStart, new Date(2026, 9, 15)),
    ).toBe(true);
  });

  it("jour de prélèvement pas encore passé", () => {
    expect(
      hasBillingDayOccurred(20, periodStart, new Date(2026, 9, 15)),
    ).toBe(false);
  });
});

describe("calculateSpendableDashboard", () => {
  it("solde à 0 → reste à dépenser 0", () => {
    const summary = calculateSpendableDashboard(
      baseInput({ openingBalance: 0, incomesSinceOpening: 0, expensesSinceOpening: 0 }),
    );
    expect(summary.currentBalance).toBe(0);
    expect(summary.remainingToSpend).toBe(0);
    expect(summary.spendableLimitedBy).toBe("zero");
    expect(summary.spendableHint).toMatch(/Rien de disponible/i);
  });

  it("solde négatif → reste à dépenser 0, solde affiché tel quel", () => {
    const summary = calculateSpendableDashboard(
      baseInput({ openingBalance: -80 }),
    );
    expect(summary.currentBalance).toBe(-80);
    expect(summary.remainingToSpend).toBe(0);
    expect(summary.spendableLimitedBy).toBe("zero");
  });

  it("solde plus petit que les enveloppes → limité par le compte", () => {
    // enveloppes restantes = 90 ; solde 50, pas de prélèvement
    const summary = calculateSpendableDashboard(
      baseInput({ openingBalance: 50 }),
    );
    expect(summary.envelopeRemaining).toBe(90);
    expect(summary.freeMoney).toBe(50);
    expect(summary.remainingToSpend).toBe(50);
    expect(summary.spendableLimitedBy).toBe("balance");
    expect(summary.spendableHint).toMatch(/Limité par ton solde/i);
  });

  it("enveloppes plus petites que le solde → limité par les enveloppes", () => {
    const summary = calculateSpendableDashboard(
      baseInput({ openingBalance: 500 }),
    );
    expect(summary.envelopeRemaining).toBe(90);
    expect(summary.freeMoney).toBe(500);
    expect(summary.remainingToSpend).toBe(90);
    expect(summary.spendableLimitedBy).toBe("envelopes");
    expect(summary.spendableHint).toMatch(/enveloppes plaisir/i);
  });

  it("abonnement déjà prélevé ce mois-ci → exclu des prélèvements à venir", () => {
    const summary = calculateSpendableDashboard(
      baseInput({
        openingBalance: 200,
        today: new Date(2026, 9, 15),
        subscriptions: [
          {
            amount: 9.99,
            frequency: "MENSUEL",
            billingDay: 5,
            status: "ACTIF",
          },
        ],
      }),
    );
    expect(summary.upcomingWithdrawals).toBe(0);
    expect(summary.remainingToSpend).toBe(90);
  });

  it("abonnement pas encore prélevé → réduit l’argent libre", () => {
    const summary = calculateSpendableDashboard(
      baseInput({
        openingBalance: 100,
        today: new Date(2026, 9, 10),
        subscriptions: [
          {
            amount: 20,
            frequency: "MENSUEL",
            billingDay: 20,
            status: "ACTIF",
          },
        ],
      }),
    );
    expect(summary.upcomingWithdrawals).toBe(20);
    expect(summary.freeMoney).toBe(80);
    expect(summary.remainingToSpend).toBe(80);
    expect(summary.spendableLimitedBy).toBe("balance");
  });

  it("mois sans rentrée : calcul OK, message disponible", () => {
    const summary = calculateSpendableDashboard(
      baseInput({
        openingBalance: 120,
        incomesTotal: 0,
      }),
    );
    expect(summary.incomesTotal).toBe(0);
    expect(summary.remainingToSpend).toBe(90);
    expect(noIncomeMessage().length).toBeGreaterThan(10);
    expect(tightMonthMessage()).toContain("serré");
  });

  it("ajustement manuel du solde : référence seule, sans mouvements", () => {
    const summary = calculateSpendableDashboard(
      baseInput({
        openingBalance: 412.3,
        incomesSinceOpening: 0,
        expensesSinceOpening: 0,
        subscriptions: [],
        debts: [],
      }),
    );
    expect(summary.currentBalance).toBe(412.3);
    expect(summary.remainingToSpend).toBe(90);
  });

  it("dette déjà payée ce mois → pas dans les prélèvements à venir", () => {
    const unpaid = calculateSpendableDashboard(
      baseInput({
        openingBalance: 100,
        debts: [
          { monthlyPayment: 30, remainingAmount: 200, paidInPeriod: false },
        ],
      }),
    );
    expect(unpaid.upcomingWithdrawals).toBe(30);
    expect(unpaid.remainingToSpend).toBe(70);

    const paid = calculateSpendableDashboard(
      baseInput({
        openingBalance: 100,
        debts: [
          { monthlyPayment: 30, remainingAmount: 200, paidInPeriod: true },
        ],
      }),
    );
    expect(paid.upcomingWithdrawals).toBe(0);
    expect(paid.remainingToSpend).toBe(90);
  });

  it("enveloppe dépassée : isOver, reste à dépenser plafonné à 0", () => {
    const summary = calculateSpendableDashboard(
      baseInput({
        openingBalance: 200,
        envelopes: [
          {
            id: "1",
            name: "Fringues",
            emoji: "👗",
            color: "#F8C8DC",
            type: "PLAISIR",
            monthlyAmount: 80,
            spent: 95,
          },
        ],
      }),
    );
    const env = summary.envelopes[0];
    expect(env.isOver).toBe(true);
    expect(env.remaining).toBe(-15);
    expect(summary.envelopeRemaining).toBe(-15);
    expect(summary.remainingToSpend).toBe(0);
    expect(summary.spendableLimitedBy).toBe("zero");
  });
});
