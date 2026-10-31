"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, name, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? (name ? String(name) : autoId);
    return (
      <div className="flex w-full flex-col">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-bold text-[#746979]">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            "mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-base text-ink",
            "focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25",
            error && "border-peach-gauge",
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-sm text-[#8d637e]">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";
