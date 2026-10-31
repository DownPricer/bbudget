import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [expenses, incomes, subscriptions, debts, wishes] = await Promise.all([
    prisma.expense.findMany({
      where: { userId },
      include: { envelope: true },
      orderBy: { date: "desc" },
    }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.subscription.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.wishItem.findMany({ where: { userId } }),
  ]);

  const lines: string[] = [];
  lines.push("type,date,label,amount,extra");
  for (const e of expenses) {
    lines.push(
      ["depense", e.date.toISOString().slice(0, 10), csvEscape(e.label), toNumber(e.amount), csvEscape(e.envelope.name)].join(","),
    );
  }
  for (const i of incomes) {
    lines.push(
      ["rentree", i.date.toISOString().slice(0, 10), csvEscape(i.label), toNumber(i.amount), i.type].join(","),
    );
  }
  for (const s of subscriptions) {
    lines.push(
      ["abonnement", "", csvEscape(s.name), toNumber(s.amount), `${s.frequency};${s.status}`].join(","),
    );
  }
  for (const d of debts) {
    lines.push(
      ["dette", "", csvEscape(d.creditor), toNumber(d.remainingAmount), `initial:${toNumber(d.initialAmount)}`].join(","),
    );
  }
  for (const w of wishes) {
    lines.push(
      ["coup_de_coeur", w.addedAt.toISOString().slice(0, 10), csvEscape(w.name), toNumber(w.price), w.status].join(","),
    );
  }

  const body = "\uFEFF" + lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bbudget-export.csv"`,
    },
  });
}
