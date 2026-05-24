"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";

type Metric = {
  concept: string;
  value: number;
  unit: string;
  period: string;
};

type CompanyDetail = {
  cik: string;
  ticker: string;
  price: number | null;
  price_last_updated: string | null;
  financials_available: boolean;
  from_cache: boolean;
  revenue: Metric | null;
  net_income: Metric | null;
  eps: Metric | null;
  total_assets: Metric | null;
  total_liabilities: Metric | null;
};

function formatValue(value: number, unit: string): string {
  if (unit === "USD") {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  }
  return value.toFixed(2);
}

function MetricRow({ label, metric }: { label: string; metric: Metric | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-hairline last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {metric ? (
        <div className="text-right">
          <span className="mono text-sm font-medium">{formatValue(metric.value, metric.unit)}</span>
          <span className="text-[11px] text-muted-foreground/60 ml-2">{metric.period}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">—</span>
      )}
    </div>
  );
}

export default function CompanyDetailPage() {
  const { cik } = useParams<{ cik: string }>();
  const searchParams = useSearchParams();
  const ticker = searchParams.get("ticker") ?? "";

  const [data, setData] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/edgar/company/${cik}/financials?ticker=${ticker}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cik, ticker]);

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

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to search
        </Link>

        {loading && (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading…</div>
        )}

        {error && (
          <div className="card-modern p-6 text-center">
            <p className="text-sm text-destructive">Failed to load company data</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm font-semibold shrink-0">
                {data.ticker.slice(0, 2)}
              </div>
              <div>
                <h1 className="display text-3xl grad-text">{data.ticker}</h1>
                <p className="text-xs text-muted-foreground mono mt-0.5">CIK {data.cik}</p>
              </div>
            </div>

            {/* Precio */}
            <div className="card-modern p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Market Price
                </span>
              </div>

              {data.price !== null ? (
                <div>
                  <p className="num text-4xl font-medium">${data.price.toFixed(2)}</p>
                  {data.price_last_updated && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="size-3 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground/60">
                        Updated {new Date(data.price_last_updated).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Price not available — ticker not in system whitelist
                </p>
              )}
            </div>

            {/* Métricas EDGAR */}
            <div className="card-modern p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Financial Data · SEC EDGAR
                </span>
                {data.from_cache && (
                  <span className="chip">cached</span>
                )}
              </div>

              {!data.financials_available ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  No XBRL financial data available for this company
                </p>
              ) : (
                <div>
                  <MetricRow label="Revenue"          metric={data.revenue} />
                  <MetricRow label="Net Income"       metric={data.net_income} />
                  <MetricRow label="EPS (basic)"      metric={data.eps} />
                  <MetricRow label="Total Assets"     metric={data.total_assets} />
                  <MetricRow label="Total Liabilities" metric={data.total_liabilities} />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}