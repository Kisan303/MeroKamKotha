import * as React from "react";
import { OTPInput as BaseOTPInput } from "input-otp";
import { cn } from "@/lib/utils";

const Slot = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { index: number }
>(({ index, ...props }, ref) => {
  return (
    <div
      className={cn(
        "relative w-10 h-14 text-[2rem]"
      )}
    >
      <input
        ref={ref}
        {...props}
        className={cn(
          "w-full h-full text-center border-2 rounded-md bg-background",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "data-[invalid=true]:border-destructive"
        )}
      />
    </div>
  );
});
Slot.displayName = "Slot";

export function OTPInput({
  maxLength = 6,
  onComplete,
}: {
  maxLength?: number;
  onComplete: (code: string) => void;
}) {
  return (
    <BaseOTPInput
      maxLength={maxLength}
      onComplete={onComplete}
      className="flex gap-2 items-center justify-center"
      render={({ slots }) => (
        <>
          {slots.map((_, i) => (
            <Slot key={i} index={i} />
          ))}
        </>
      )}
    />
  );
}