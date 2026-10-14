"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink mb-1">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? "border-danger" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
