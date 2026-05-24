"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

type Company = {
  name: string;
  ticker: string;
  cik: number;
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/edgar/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-hairline px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg ring-grad flex items-center justify-center">
            <div className="size-3 rounded-sm bg-background" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">StockWatch</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
<h1 className="display text-5xl grad-text">Find a company</h1>
        </header>

        <form onSubmit={handleSearch} className="card-modern flex items-center gap-3 px-5 py-4">
          {loading
            ? <Loader2 className="size-4 text-muted-foreground shrink-0 animate-spin" />
            : <Search className="size-4 text-muted-foreground shrink-0" />
          }
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ticker or company name…"
            className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {results.length > 0 && (
            <span className="chip mono normal-case">{results.length}</span>
          )}
        </form>

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 space-y-1">
            <p className="text-muted-foreground text-sm">No companies found for &ldquo;{q}&rdquo;</p>
            <p className="text-[12px] text-muted-foreground/50">
              Try a ticker like <span className="mono">AAPL</span> or a name like Apple
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map((c) => (
              <Link
                key={c.cik}
                href={`/company/${c.ticker}`}
                className="card-modern p-4 hover:bg-surface-elevated transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-xs font-medium shrink-0">
                    {c.ticker.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.ticker}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.name}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-hairline">
                  <span className="mono text-[11px] text-muted-foreground">CIK {c.cik}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!q.trim() && (
          <p className="text-center text-[13px] text-muted-foreground/50 py-4">
            Start typing to search across all SEC-registered companies
          </p>
        )}
      </main>
    </div>
  );
}