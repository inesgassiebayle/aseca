"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { LastUpdateBadge } from "@/components/LastUpdateBadge";

type Company = { name: string; ticker: string; cik: number };
type PriceMap = Record<string, number | null>;

async function fetchPrices(companies: Company[]): Promise<PriceMap> {
  const entries = await Promise.all(
    companies.map(async (c) => {
      try {
        const r = await fetch(`/api/v1/prices/${c.ticker}`);
        const d = await r.json();
        return [c.ticker, d.price ?? null] as const;
      } catch {
        return [c.ticker, null] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const [inputQ, setInputQ] = useState(urlQ);
  const [results, setResults] = useState<Company[]>([]);
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setInputQ(urlQ);
    if (!urlQ) return;
    setLoading(true);
    setPrices({});
    fetch(`/api/v1/edgar/search?q=${encodeURIComponent(urlQ)}`)
      .then((r) => r.json())
      .then((data: Company[]) => {
        const companies = Array.isArray(data) ? data : [];
        setResults(companies);
        setSearched(true);
        fetchPrices(companies).then(setPrices);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [urlQ]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!inputQ.trim()) return;
    router.push(`/search?q=${encodeURIComponent(inputQ.trim())}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-hairline px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg ring-grad flex items-center justify-center">
            <div className="size-3 rounded-sm bg-background" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">StockWatch</span>
        </Link>
        <LastUpdateBadge />
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
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            placeholder="Search by ticker or company name…"
            className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {results.length > 0 && (
            <span className="chip mono normal-case">{results.length}</span>
          )}
        </form>

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 space-y-1">
            <p className="text-muted-foreground text-sm">No companies found for &ldquo;{urlQ}&rdquo;</p>
            <p className="text-[12px] text-muted-foreground/50">
              Try a ticker like <span className="mono">AAPL</span> or a name like Apple
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map((c) => {
              const price = prices[c.ticker];
              const priceReady = c.ticker in prices;
              return (
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
                    <div className="ml-auto text-right shrink-0">
                      {!priceReady ? (
                        <Loader2 className="size-3 animate-spin text-muted-foreground" />
                      ) : price !== null ? (
                        <span className="mono text-sm">${price.toFixed(2)}</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">Price not available</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-hairline">
                    <span className="mono text-[11px] text-muted-foreground">CIK {c.cik}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!inputQ.trim() && !searched && (
          <p className="text-center text-[13px] text-muted-foreground/50 py-4">
            Start typing to search across all SEC-registered companies
          </p>
        )}
      </main>
    </div>
  );
}