import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        default: "h-9 px-3 py-1",
        lg: "h-11 px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ inputSize }), className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input, inputVariants };
