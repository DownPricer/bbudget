"use client";

import { cn } from "@/lib/utils";

type CircularGaugeProps = {
  /** 0–1 (peut dépasser 1) */
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  /** Couleur de la jauge (défaut rose) */
  color?: string;
  trackColor?: string;
};

export function CircularGauge({
  progress,
  size = 180,
  stroke = 12,
  className,
  children,
  color = "#F4A4B8",
  trackColor = "#FCE4EC",
}: CircularGaugeProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clamped);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {children}
      </div>
    </div>
  );
}
