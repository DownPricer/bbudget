import { describe, expect, it } from "vitest";
import {
  calculateInstallmentEndDate,
  generateInstallmentSchedule,
  installmentExpenseLabel,
  selectDueInstallments,
  splitInstallmentAmounts,
  sumUpcomingInstallmentsInPeriod,
} from "./installments";
import { calculateSpendableDashboard } from "./calculate";

describe("splitInstallmentAmounts", () => {
  it("répartit équitablement avec reste sur la dernière", () => {
    expect(splitInstallmentAmounts(100, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(splitInstallmentAmounts(10, 3)).toEqual([3.33, 3.33, 3.34]);
    expect(splitInstallmentAmounts(99.99, 4)).toEqual([24.99, 24.99, 24.99, 25.02]);
  });

  it("1ʳᵉ échéance différente puis reste réparti", () => {
    // total 100, first 40 → reste 60 / 2 = 30, 30
    expect(splitInstallmentAmounts(100, 3, 40)).toEqual([40, 30, 30]);
    // reste 50.01 / 2 → 25.00 + 25.01
    expect(splitInstallmentAmounts(100.01, 3, 50)).toEqual([50, 25, 25.01]);
  });

  it("somme toujours égale au total", () => {
    for (const [total, n, first] of [
      [123.45, 10, null],
      [199.99, 4, 49.99],
      [50, 2, null],
    ] as const) {
      const parts = splitInstallmentAmounts(total, n, first);
      const sum = Math.round(parts.reduce((s, x) => s + x, 0) * 100) / 100;
      expect(sum).toBe(total);
      expect(parts).toHaveLength(n);
    }
  });
});

describe("generateInstallmentSchedule", () => {
  it("génère dates mensuelles et date de fin", () => {
    const first = new Date(2026, 10, 5); // 5 nov
    const schedule = generateInstallmentSchedule({
      totalAmount: 120,
      installmentCount: 4,
      firstDueDate: first,
      frequency: "MENSUELLE",
    });
    expect(schedule).toHaveLength(4);
    expect(schedule.map((s) => s.amount)).toEqual([30, 30, 30, 30]);
    expect(schedule[0].dueDate.getMonth()).toBe(10);
    expect(schedule[1].dueDate.getMonth()).toBe(11);
    expect(schedule[3].index).toBe(4);
    expect(calculateInstallmentEndDate(first, 4, "MENSUELLE").getMonth()).toBe(1); // fév
  });

  it("fréquence bi-hebdomadaire", () => {
    const first = new Date(2026, 0, 1);
    const schedule = generateInstallmentSchedule({
      totalAmount: 40,
      installmentCount: 3,
      firstDueDate: first,
      frequency: "BI_HEBDOMADAIRE",
    });
    expect(schedule[1].dueDate.getDate()).toBe(15);
    expect(schedule[2].dueDate.getDate()).toBe(29);
  });
});

describe("selectDueInstallments / pas de doublon logique", () => {
  const today = new Date(2026, 10, 15);

  it("sélectionne les A_VENIR dues sans expense", () => {
    const due = selectDueInstallments(
      [
        {
          id: "1",
          status: "A_VENIR",
          dueDate: new Date(2026, 10, 10),
          skipExpense: false,
          expenseId: null,
        },
        {
          id: "2",
          status: "A_VENIR",
          dueDate: new Date(2026, 10, 20),
          skipExpense: false,
          expenseId: null,
        },
        {
          id: "3",
          status: "PAYEE",
          dueDate: new Date(2026, 10, 1),
          skipExpense: false,
          expenseId: "exp",
        },
        {
          id: "4",
          status: "A_VENIR",
          dueDate: new Date(2026, 10, 5),
          skipExpense: true,
          expenseId: null,
        },
        {
          id: "5",
          status: "A_VENIR",
          dueDate: new Date(2026, 10, 12),
          skipExpense: false,
          expenseId: "already",
        },
      ],
      today,
    );
    expect(due.map((d) => d.id)).toEqual(["1"]);
  });

  it("plan en cours de route : échéances déjà cochées ignorées (skipExpense)", () => {
    const due = selectDueInstallments(
      [
        {
          status: "PAYEE",
          dueDate: new Date(2026, 9, 5),
          skipExpense: true,
          expenseId: null,
        },
        {
          status: "PAYEE",
          dueDate: new Date(2026, 10, 5),
          skipExpense: true,
          expenseId: null,
        },
        {
          status: "A_VENIR",
          dueDate: new Date(2026, 11, 5),
          skipExpense: false,
          expenseId: null,
        },
      ],
      today,
    );
    expect(due).toHaveLength(0);
  });
});

describe("installments ↔ reste à dépenser", () => {
  it("échéances du mois en cours dans les prélèvements à venir", () => {
    const periodStart = new Date(2026, 10, 1);
    const periodEnd = new Date(2026, 10, 30, 23, 59, 59, 999);
    const upcomingInst = sumUpcomingInstallmentsInPeriod(
      [
        { status: "A_VENIR", amount: 25, dueDate: new Date(2026, 10, 20) },
        { status: "A_VENIR", amount: 25, dueDate: new Date(2026, 11, 20) },
        { status: "PAYEE", amount: 25, dueDate: new Date(2026, 10, 5) },
      ],
      periodStart,
      periodEnd,
    );
    expect(upcomingInst).toBe(25);

    const summary = calculateSpendableDashboard({
      openingBalance: 200,
      incomesSinceOpening: 0,
      expensesSinceOpening: 0,
      today: new Date(2026, 10, 10),
      periodStart,
      periodEnd,
      subscriptions: [],
      debts: [],
      installmentPayments: [
        { status: "A_VENIR", amount: 25, dueDate: new Date(2026, 10, 20) },
      ],
      envelopes: [
        {
          id: "1",
          name: "Divers",
          emoji: "🛍️",
          color: "#FFE5B4",
          type: "PLAISIR",
          monthlyAmount: 100,
          spent: 0,
        },
      ],
      incomesTotal: 0,
      allocation: { pleasurePercent: 60, savingsPercent: 25, debtBonusPercent: 15 },
    });
    expect(summary.upcomingWithdrawals).toBe(25);
    expect(summary.freeMoney).toBe(175);
    expect(summary.remainingToSpend).toBe(100);
  });
});

describe("labels", () => {
  it("libellé dépense échéance", () => {
    expect(installmentExpenseLabel(2, 4, "Sneakers")).toBe(
      "Échéance 2/4 – Sneakers",
    );
  });
});

describe("annulation conceptuelle", () => {
  it("ne conserve que les PAYEE après filtre d’annulation", () => {
    const payments = [
      { status: "PAYEE", index: 1 },
      { status: "A_VENIR", index: 2 },
      { status: "A_VENIR", index: 3 },
    ];
    const kept = payments.filter((p) => p.status === "PAYEE");
    expect(kept).toHaveLength(1);
    expect(payments.filter((p) => p.status === "A_VENIR")).toHaveLength(2);
  });
});
