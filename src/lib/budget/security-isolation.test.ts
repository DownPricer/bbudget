import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: "user-b",
  findFirst: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getUserOrThrow: async () => ({
    id: mocks.userId,
    email: "user2@bbudget.app",
    firstName: "Alex",
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      delete: (...args: unknown[]) => mocks.delete(...args),
      update: (...args: unknown[]) => mocks.update(...args),
      create: (...args: unknown[]) => mocks.create(...args),
    },
    envelope: {
      findFirst: vi.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.userId === "user-b" && where.id === "env-a") return null;
        if (where.userId === "user-b") return { id: "env-b" };
        return null;
      }),
    },
    debt: {
      findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      delete: (...args: unknown[]) => mocks.delete(...args),
    },
    income: {
      findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      delete: (...args: unknown[]) => mocks.delete(...args),
    },
    subscription: {
      findFirst: (...args: unknown[]) => mocks.findFirst(...args),
      update: (...args: unknown[]) => mocks.update(...args),
    },
  },
}));

import { deleteExpense, createExpense, updateExpense } from "@/app/actions/expenses";
import { deleteIncome } from "@/app/actions/incomes";
import { deleteDebt } from "@/app/actions/debts";
import { setSubscriptionStatus } from "@/app/actions/subscriptions";

describe("Isolation multi-utilisateur (actions serveur)", () => {
  beforeEach(() => {
    mocks.userId = "user-b";
    mocks.findFirst.mockReset();
    mocks.delete.mockReset();
    mocks.update.mockReset();
    mocks.create.mockReset();
  });

  it("deleteExpense refuse un ID d'un autre user", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const r = await deleteExpense("expense-of-user-a");
    expect(r).toEqual({ ok: false, error: "Dépense introuvable" });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("updateExpense refuse un ID d'un autre user", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const r = await updateExpense({
      id: "expense-of-user-a",
      amount: "10",
      envelopeId: "env-b",
      label: "Hack",
    });
    expect(r.ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("createExpense refuse une enveloppe d'un autre user", async () => {
    const r = await createExpense({
      amount: "10",
      envelopeId: "env-a",
      label: "Hack",
    });
    expect(r.ok).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("deleteIncome refuse un ID d'un autre user", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const r = await deleteIncome("income-of-user-a");
    expect(r).toEqual({ ok: false, error: "Rentrée introuvable" });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("deleteDebt refuse un ID d'un autre user", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const r = await deleteDebt("debt-of-user-a");
    expect(r).toEqual({ ok: false, error: "Dette introuvable" });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("setSubscriptionStatus refuse un ID d'un autre user", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const r = await setSubscriptionStatus("sub-of-user-a", "RESILIE");
    expect(r.ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("Validation serveur montants", () => {
  it("rejette vide, négatif, zéro ; accepte virgule ; plafonne à 100 000 €", async () => {
    const { amountSchema, MAX_AMOUNT } = await import("@/lib/validations/money");
    expect(amountSchema.safeParse("").success).toBe(false);
    expect(amountSchema.safeParse("-1").success).toBe(false);
    expect(amountSchema.safeParse("0").success).toBe(false);
    expect(amountSchema.safeParse("12,50").success).toBe(true);
    expect(amountSchema.safeParse(12.5).success).toBe(true);
    expect(amountSchema.safeParse(MAX_AMOUNT).success).toBe(true);
    const huge = amountSchema.safeParse("999999999");
    expect(huge.success).toBe(false);
    if (!huge.success) {
      expect(huge.error.issues[0]?.message).toMatch(/100[\s\u00a0]?000/);
    }
  });
});
