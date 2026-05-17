"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? (mode === "login" ? "Invalid credentials" : "Registration failed"));
        return;
      }

      const data = await res.json();
      if (mode === "login") {
        localStorage.setItem("access_token", data.access_token);
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 60%)" }}
      />

      <aside className="hidden md:flex flex-col justify-between p-12 relative">
        <Link href="/" className="flex items-center gap-2.5 relative">
          <div className="size-7 rounded-lg ring-grad flex items-center justify-center">
            <div className="size-3 rounded-sm bg-background" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Aseca</span>
        </Link>
        <div className="relative">
          <h2 className="display text-5xl md:text-6xl grad-text leading-[1]">
            A quieter way<br />to watch the market.
          </h2>
          <p className="text-xs uppercase tracking-wider mt-6 text-muted-foreground">
            SEC EDGAR · Yahoo Finance
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground relative">© 2026 Aseca</p>
      </aside>

      <section className="flex items-center justify-center p-6 md:p-12 relative">
        <form className="card-modern p-8 w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          <div>
            <div className="chip mb-3">{mode === "login" ? "Welcome back" : "Get started"}</div>
            <h1 className="display text-3xl">{mode === "login" ? "Sign in" : "Create account"}</h1>
          </div>

          <Field label="Email" type="email" placeholder="you@email.com" value={email} onChange={setEmail} />
          <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
          {mode === "register" && (
            <Field label="Confirm password" type="password" placeholder="••••••••" value={confirmPassword} onChange={setConfirmPassword} />
          )}

          {error && (
            <p className="text-[13px] text-negative text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-[13px] font-medium glow-primary disabled:opacity-50"
          >
            {loading
              ? mode === "login" ? "Signing in…" : "Creating account…"
              : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <p className="text-[13px] text-muted-foreground text-center">
            {mode === "login" ? (
              <>No account? <Link href="/register" className="text-foreground">Register</Link></>
            ) : (
              <>Already registered? <Link href="/login" className="text-foreground">Sign in</Link></>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}

function Field({
  label, type, placeholder, value, onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full mt-1.5 bg-surface border border-hairline rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
      />
    </label>
  );
}