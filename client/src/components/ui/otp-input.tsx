import * as React from "react";
import { cn } from "@/lib/utils";

export function OTPInput({
  maxLength = 6,
  onComplete,
}: {
  maxLength?: number;
  onComplete: (code: string) => void;
}) {
  const [code, setCode] = React.useState<string[]>(Array(maxLength).fill(''));
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Move to next input if value is entered
    if (value && index < maxLength - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (newCode.every(digit => digit) && newCode.join('').length === maxLength) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  React.useEffect(() => {
    // Focus first input on mount
    inputs.current[0]?.focus();
  }, []);

  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length: maxLength }).map((_, index) => (
        <input
          key={index}
          ref={el => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={code[index]}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          className={cn(
            "w-12 h-14 text-center text-2xl border-2 rounded-md bg-background",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "transition-all duration-200"
          )}
        />
      ))}
    </div>
  );
}