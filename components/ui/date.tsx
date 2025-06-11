import * as React from "react";
import { cn } from "@/lib/utils";

export type DateInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="date"
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-base",
          "placeholder:text-muted-foreground text-foreground ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
