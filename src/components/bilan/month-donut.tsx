"use client";

import { formatEuro } from "@/lib/utils";

type Slice = { name: string; value: number; color: string };

function buildConicStops(slices: Slice[], total: number): string[] {
  return slices.reduce<{ stops: string[]; cursor: number }>(
    (acc, d) => {
      const start = acc.cursor;
      const end = acc.cursor + (d.value / total) * 100;
      return {
        cursor: end,
        stops: [...acc.stops, `${d.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`],
      };
    },
    { stops: [], cursor: 0 },
  ).stops;
}

export function MonthDonut({ data }: { data: Slice[] }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Pas encore de dépenses à afficher ce mois-ci.
      </p>
    );
  }

  const stops = buildConicStops(filtered, total);

  return (
    <div>
      <div
        className="relative mx-auto my-[18px] grid h-[164px] w-[164px] place-items-center rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute h-[110px] w-[110px] rounded-full bg-white" />
        <div className="relative text-center">
          <p className="text-lg font-bold tabular-nums text-ink">{formatEuro(total)}</p>
          <p className="text-[10px] font-medium text-muted">Dépenses plaisir</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-ink">
        {filtered.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.name} {formatEuro(d.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
