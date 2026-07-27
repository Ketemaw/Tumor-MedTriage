"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`bg-white border ${error ? "border-[var(--color-urgent)]" : "border-[var(--color-border)]"} rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-primary)] transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--color-urgent)]">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";
export default Input;
