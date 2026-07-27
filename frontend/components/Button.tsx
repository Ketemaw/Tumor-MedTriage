"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md";
}

const variants = {
  primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dim)] disabled:opacity-50",
  secondary: "bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)]",
  ghost: "text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
  danger: "bg-transparent text-[var(--color-urgent)] border border-[var(--color-urgent)]/40 hover:bg-[var(--color-urgent-tint)]",
};

const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };

export default function Button({
  children, variant = "primary", size = "md", loading, className = "", disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
