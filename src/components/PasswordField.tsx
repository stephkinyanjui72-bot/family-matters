"use client";
import { useState } from "react";

// Reusable password input with a show/hide eye toggle.
export function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg px-2 py-1 text-lg select-none"
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
