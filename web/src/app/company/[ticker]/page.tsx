"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { LastUpdateBadge } from "@/components/LastUpdateBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { BuyDialog } from "@/components/ui/buy-dialog";
import { SellDialog } from "@/components/ui/sell-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Company        = { name: string; ticker: string; cik: number };
type Filing         = { type: string; date: string; url: string };
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

type MetricKey  = "revenue" | "net_income" | "eps";
type DataPoint  = { period_end: string; value: number; form: string; filed: string };
type MetricHistory = { cik: number; metric: string; data_points: DataPoint[]; cached: boolean };

const METRICS: { key: MetricKey; label: string }[] = [
    { key: "revenue",    label: "Revenue"    },
    { key: "net_income", label: "Net Income" },
    { key: "eps",        label: "EPS"        },
];

function formatFinancialValue(value: number, unit: string): string {
    if (unit === "USD") {
        if (Math.abs(value) >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
        if (Math.abs(value) >= 1e9)  return "$" + (value / 1e9).toFixed(2)  + "B";
        if (Math.abs(value) >= 1e6)  return "$" + (value / 1e6).toFixed(2)  + "M";
        return "$" + value.toFixed(2);
    }
    return value.toFixed(2);
}

function formatMetricValue(value: number, metric: MetricKey): string {
    if (metric === "eps") return `$${value.toFixed(2)}`;
    const abs = Math.abs(value);
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

export default function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
    const router = useRouter();
    const [ticker, setTicker]                 = useState("");
    const [company, setCompany]               = useState<Company | null>(null);
    const [price, setPrice]                   = useState<number | null | undefined>(undefined);
    const [filings, setFilings]               = useState<Filing[]>([]);
    const [filingsMessage, setFilingsMessage] = useState<string | null>(null);
    const [tab, setTab]                       = useState<"overview" | "financials" | "filings" | "metrics">("overview");
    const [buyOpen, setBuyOpen]               = useState(false);
    const [sellOpen, setSellOpen]             = useState(false);

    const [financials, setFinancials]               = useState<CompanyDetail | null>(null);
    const [loadingFinancials, setLoadingFinancials] = useState(false);

    const [metric, setMetric]         = useState<MetricKey>("revenue");
    const [metricData, setMetricData] = useState<MetricHistory | null>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    const [loadingCompany, setLoadingCompany] = useState(true);
    const [loadingFilings, setLoadingFilings] = useState(false);
    const [notFound, setNotFound]             = useState(false);

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

    useEffect(() => {
        if (!company || tab !== "metrics") return;
        setLoadingMetrics(true);
        setMetricData(null);
        fetch(`/api/v1/edgar/companies/${company.cik}/metrics/${metric}`)
            .then((r) => r.json())
            .then((data: MetricHistory) => setMetricData(data))
            .catch(() => setMetricData(null))
            .finally(() => setLoadingMetrics(false));
    }, [company, tab, metric]);

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
                <Link href="/search" className="chip hover:text-foreground transition-colors">Back to search</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="chip hover:text-foreground transition-colors w-fit">
                        ← Back
                    </button>
                    <LastUpdateBadge />
                </div>

                {/* Hero — two column like Lovable */}
                <section className="card-modern relative overflow-hidden p-8 noise">
                    <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 md:items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-12 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm shrink-0">
                                    {company.ticker.slice(0, 2)}
                                </div>
                                <div>
                                    <div className="mono text-xs text-muted-foreground">{company.ticker} · CIK {company.cik}</div>
                                </div>
                            </div>
                            <h1 className="display text-4xl md:text-6xl grad-text leading-[1]">{company.name}</h1>
                        </div>

                        <div className="md:text-right">
                            <div className="mono text-4xl">
                                {price === undefined && <Skeleton className="h-10 w-32 ml-auto" />}
                                {price !== undefined && price !== null && `$${price.toFixed(2)}`}
                                {price === null && <span className="text-sm text-muted-foreground/60">Price not available</span>}
                            </div>
                            <div className="flex md:justify-end gap-2 mt-5">
                                <button
                                    onClick={() => setBuyOpen(true)}
                                    className="text-[13px] font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full glow-primary"
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={() => setSellOpen(true)}
                                    className="text-[13px] font-medium border border-hairline px-4 py-2 rounded-full hover:bg-surface-elevated transition-colors"
                                >
                                    Sell
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs */}
                <nav className="inline-flex gap-1 p-1 rounded-full border border-hairline bg-surface/60">
                    {(["overview", "financials", "filings", "metrics"] as const).map((t) => (
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
                    <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {financials?.financials_available ? (
                            <>
                                {financials.revenue && (
                                    <div className="card-modern p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
                                        <p className="mono text-2xl mt-2">{formatFinancialValue(financials.revenue.value, financials.revenue.unit)}</p>
                                    </div>
                                )}
                                {financials.net_income && (
                                    <div className="card-modern p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Income</p>
                                        <p className="mono text-2xl mt-2">{formatFinancialValue(financials.net_income.value, financials.net_income.unit)}</p>
                                    </div>
                                )}
                                {financials.eps && (
                                    <div className="card-modern p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">EPS</p>
                                        <p className="mono text-2xl mt-2">{formatFinancialValue(financials.eps.value, financials.eps.unit)}</p>
                                    </div>
                                )}
                                {financials.total_assets && (
                                    <div className="card-modern p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assets</p>
                                        <p className="mono text-2xl mt-2">{formatFinancialValue(financials.total_assets.value, financials.total_assets.unit)}</p>
                                    </div>
                                )}
                                {financials.total_liabilities && (
                                    <div className="card-modern p-4">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Liabilities</p>
                                        <p className="mono text-2xl mt-2">{formatFinancialValue(financials.total_liabilities.value, financials.total_liabilities.unit)}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="card-modern p-5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticker</p>
                                    <p className="mono text-2xl mt-2">{company.ticker}</p>
                                </div>
                                <div className="card-modern p-5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CIK</p>
                                    <p className="mono text-2xl mt-2">{company.cik}</p>
                                </div>
                                <div className="card-modern p-5 col-span-2 md:col-span-3">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Company name</p>
                                    <p className="mono text-lg mt-2">{company.name}</p>
                                </div>
                            </>
                        )}
                    </section>
                )}

                {tab === "financials" && (
                    <section className="card-modern p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financial Data · SEC EDGAR</span>
                            {financials?.from_cache && <span className="chip">cached</span>}
                        </div>
                        {loadingFinancials && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!loadingFinancials && financials && !financials.financials_available && (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">No XBRL financial data available for this company</p>
                        )}
                        {!loadingFinancials && financials?.financials_available && (
                            <div>
                                {[
                                    { label: "Revenue",           metric: financials.revenue },
                                    { label: "Net Income",        metric: financials.net_income },
                                    { label: "EPS (basic)",       metric: financials.eps },
                                    { label: "Total Assets",      metric: financials.total_assets },
                                    { label: "Total Liabilities", metric: financials.total_liabilities },
                                ].map(({ label, metric }) => (
                                    <div key={label} className="flex items-center justify-between py-3 border-b border-hairline last:border-0">
                                        <span className="text-sm text-muted-foreground">{label}</span>
                                        {metric ? (
                                            <div className="text-right">
                                                <span className="mono text-sm font-medium">{formatFinancialValue(metric.value, metric.unit)}</span>
                                                <span className="text-[11px] text-muted-foreground/60 ml-2">{metric.period}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/50 italic">-</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {tab === "filings" && (
                    <section className="space-y-3">
                        {loadingFilings && (
                            <div className="card-modern overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...Array(4)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell />
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {!loadingFilings && filingsMessage && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-sm">{filingsMessage}</p>
                            </div>
                        )}
                        {!loadingFilings && filings.length > 0 && (
                            <div className="card-modern overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Filing</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filings.map((f, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <span className="mono text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-md">{f.type}</span>
                                                </TableCell>
                                                <TableCell className="mono text-xs text-muted-foreground">{f.date}</TableCell>
                                                <TableCell className="text-right">
                                                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                                                       className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                        SEC EDGAR submission
                                                        <ExternalLink className="size-3" />
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </section>
                )}

                {tab === "metrics" && (
                    <section className="space-y-4">
                        <div className="flex gap-2" data-testid="metric-selector">
                            {METRICS.map((m) => (
                                <button
                                    key={m.key}
                                    data-testid={`metric-btn-${m.key}`}
                                    onClick={() => setMetric(m.key)}
                                    className={`chip transition-colors ${
                                        metric === m.key ? "bg-primary text-primary-foreground" : "hover:text-foreground"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {loadingMetrics && (
                            <div className="card-modern overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Form</TableHead>
                                            <TableHead>Filed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...Array(4)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {!loadingMetrics && metricData && metricData.data_points.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-sm">No historical data available for this metric.</p>
                            </div>
                        )}

                        {!loadingMetrics && metricData && metricData.data_points.length > 0 && (
                            <>
                                <div className="card-modern overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period end</TableHead>
                                                <TableHead className="text-right">Value</TableHead>
                                                <TableHead>Form</TableHead>
                                                <TableHead>Filed</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {metricData.data_points.map((dp, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="mono text-xs text-muted-foreground">{dp.period_end}</TableCell>
                                                    <TableCell className="mono text-sm text-right">{formatMetricValue(dp.value, metric)}</TableCell>
                                                    <TableCell>
                                                        <span className="mono text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-md">{dp.form}</span>
                                                    </TableCell>
                                                    <TableCell className="mono text-xs text-muted-foreground">{dp.filed}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {metricData.cached && (
                                    <p className="text-[11px] text-muted-foreground/50 text-right" data-testid="cached-badge">
                                        Cached · refreshes every hour
                                    </p>
                                )}
                            </>
                        )}
                    </section>
                )}
            </main>

            <BuyDialog
                open={buyOpen}
                onClose={() => setBuyOpen(false)}
                onSuccess={() => {}}
                defaultTicker={ticker}
            />

            <SellDialog
                ticker={sellOpen ? ticker : null}
                onClose={() => setSellOpen(false)}
                onSuccess={() => {}}
            />
        </div>
    );
}