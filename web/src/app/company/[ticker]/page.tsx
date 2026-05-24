"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { LastUpdateBadge } from "@/components/LastUpdateBadge";

type Company = { name: string; ticker: string; cik: number };
type Filing = { type: string; date: string; url: string };
type FilingsResponse = { filings: Filing[]; message: string | null };
type Metric = { concept: string; value: number; unit: string; period: string };
type CompanyDetail = {
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
    if (Math.abs(value) >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
    if (Math.abs(value) >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
    if (Math.abs(value) >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
    return "$" + value.toFixed(2);
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

export default function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [price, setPrice] = useState<number | null | undefined>(undefined);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [filingsMessage, setFilingsMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "financials" | "filings">("overview");
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [financials, setFinancials] = useState<CompanyDetail | null>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    params.then(({ ticker }) => setTicker(ticker.toUpperCase()));
  }, [params]);

  useEffect(() => {
    if (!ticker) return;
    setLoadingCompany(true);
    fetch(`/api/v1/edgar/search?q=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((data: Company[]) => {
        const match = data.find((c) => c.ticker.toUpperCase() === ticker);
        if (!match) { setNotFound(true); return; }
        setCompany(match);
        fetch(`/api/v1/prices/${ticker}`)
          .then((r) => r.json())
          .then((d) => setPrice(d.price ?? null))
          .catch(() => setPrice(null));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingCompany(false));
  }, [ticker]);

  useEffect(() => {
    if (!company || tab !== "financials") return;
    if (financials) return;
    setLoadingFinancials(true);
    fetch("/api/v1/edgar/company/" + company.cik + "/financials?ticker=" + company.ticker)
      .then((r) => r.json())
      .then(setFinancials)
      .finally(() => setLoadingFinancials(false));
  }, [company, tab]);

  useEffect(() => {
    if (!company || tab !== "filings") return;
    if (filings.length > 0 || filingsMessage) return;
    setLoadingFilings(true);
    fetch(`/api/v1/edgar/companies/${company.cik}/filings`)
      .then((r) => r.json())
      .then((data: FilingsResponse) => {
        setFilings(data.filings);
        setFilingsMessage(data.message);
      })
      .finally(() => setLoadingFilings(false));
  }, [company, tab]);

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Company not found for ticker <span className="mono">{ticker}</span></p>
        <Link href="/search" className="chip hover:text-foreground transition-colors">← Back to search</Link>
      </div>
    );
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
        <button onClick={() => router.back()} className="chip hover:text-foreground transition-colors w-fit">
          ← Back
        </button>

        <section className="card-modern p-8 noise">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm shrink-0">
                {company.ticker.slice(0, 2)}
              </div>
              <div>
                <div className="mono text-xs text-muted-foreground">{company.ticker} · CIK {company.cik}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              {price === undefined && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {price !== undefined && price !== null && (
                <span className="mono text-2xl">${price.toFixed(2)}</span>
              )}
              {price === null && (
                <span className="text-xs text-muted-foreground/60">Price not available</span>
              )}
            </div>
          </div>
          <h1 className="display text-4xl md:text-5xl grad-text leading-tight">{company.name}</h1>
        </section>

        <nav className="inline-flex gap-1 p-1 rounded-full border border-hairline bg-surface/60">
          {(["overview", "financials", "filings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-[13px] rounded-full capitalize transition-colors ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <section className="grid grid-cols-2 gap-3">
            <div className="card-modern p-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticker</p>
              <p className="mono text-2xl mt-2">{company.ticker}</p>
            </div>
            <div className="card-modern p-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CIK</p>
              <p className="mono text-2xl mt-2">{company.cik}</p>
            </div>
            <div className="card-modern p-5 col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Company name</p>
              <p className="mono text-lg mt-2">{company.name}</p>
            </div>
          </section>
        )}

        {tab === "financials" && (
          <section className="card-modern p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financial Data · SEC EDGAR</span>
              {financials?.from_cache && <span className="chip">cached</span>}
            </div>
            {loadingFinancials && <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
            {!loadingFinancials && financials && !financials.financials_available && (
              <p className="text-sm text-muted-foreground italic py-4 text-center">No XBRL financial data available for this company</p>
            )}
            {!loadingFinancials && financials?.financials_available && (
              <div>
                <MetricRow label="Revenue" metric={financials.revenue} />
                <MetricRow label="Net Income" metric={financials.net_income} />
                <MetricRow label="EPS (basic)" metric={financials.eps} />
                <MetricRow label="Total Assets" metric={financials.total_assets} />
                <MetricRow label="Total Liabilities" metric={financials.total_liabilities} />
              </div>
            )}
          </section>
        )}

        {tab === "filings" && (
          <section className="space-y-3">
            {loadingFilings && (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingFilings && filingsMessage && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">{filingsMessage}</p>
              </div>
            )}

            {!loadingFilings && filings.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-modern p-4 flex items-center gap-4 hover:bg-surface-elevated transition-colors"
              >
                <span className="mono text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-md shrink-0">
                  {f.type}
                </span>
                <span className="text-sm flex-1">SEC EDGAR submission</span>
                <span className="mono text-xs text-muted-foreground">{f.date}</span>
                <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}