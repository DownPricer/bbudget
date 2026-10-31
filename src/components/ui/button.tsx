import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-opacity active:opacity-90 disabled:pointer-events-none disabled:opacity-50 touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/40",
  {
    variants: {
      variant: {
        primary: "rounded-[13px] bg-pink text-white",
        mint: "rounded-[13px] bg-mint-btn text-white",
        secondary: "rounded-[13px] bg-pale text-rose-deep",
        ghost:
          "w-full rounded-[14px] border border-dashed border-[#ddcedb] bg-white px-4 py-3 font-bold text-[#8d637e]",
        outline:
          "rounded-[13px] border border-line bg-white text-ink",
      },
      size: {
        sm: "h-11 min-h-11 px-3 text-sm",
        md: "h-11 px-4 text-[15px]",
        lg: "h-12 w-full px-4 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
