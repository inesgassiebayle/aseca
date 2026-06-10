"use client";

import { useState, useEffect } from "react";

type MetricItem = {
    ticker: string;
    financials_available: boolean;
    revenue: number | null;
    revenue_period: string | null;
    net_income: number | null;
    eps: number | null;
    total_assets: number | null;
    total_liabilities: number | null;
};

type HistoryPoint = {
    period_end: string;
    value: number;
    form: string;
    filed: string;
};

type HistoryItem = {
    ticker: string;
    data_points: HistoryPoint[];
    quarters_available: number;
};

const METRICS = ["revenue", "net_income", "eps"] as const;
type Metric = typeof METRICS[number];

function fmt(value: number | null): string {
    if (value === null) return "N/A";
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
}

export default function ComparePage() {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [compareData, setCompareData] = useState<MetricItem[] | null>(null);
    const [historyData, setHistoryData] = useState<HistoryItem[] | null>(null);
    const [activeMetric, setActiveMetric] = useState<Metric>("revenue");
    const [loadingCompare, setLoadingCompare] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        fetch("/api/v1/watchlist/", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => setWatchlist(data.map((i: { ticker: string }) => i.ticker)));
    }, []);

    function toggleTicker(ticker: string) {
        setSelected(prev =>
            prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
        );
    }

    async function handleCompare() {
        if (selected.length < 1) return;
        setLoadingCompare(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`/api/v1/watchlist/compare?tickers=${selected.join(",")}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setCompareData(await res.json());
        } catch {
            setError("No se pudieron obtener las métricas.");
        } finally {
            setLoadingCompare(false);
        }
    }

    async function handleHistory() {
        if (selected.length < 1) return;
        setLoadingHistory(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(
                `/api/v1/watchlist/compare/history?tickers=${selected.join(",")}&metric=${activeMetric}&quarters=8`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error();
            setHistoryData(await res.json());
        } catch {
            setError("No se pudo obtener la evolución histórica.");
        } finally {
            setLoadingHistory(false);
        }
    }

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <header>
                <div className="chip mb-3">Watchlist</div>
                <h1 className="display text-5xl md:text-6xl grad-text">Compare</h1>
            </header>

            <section className="space-y-3">
                <p className="text-sm text-muted-foreground">Seleccioná las empresas a comparar:</p>
                <div data-testid="ticker-selector" className="flex flex-wrap gap-2">
                    {watchlist.map(t => (
                        <button
                            key={t}
                            data-testid={`ticker-btn-${t}`}
                            onClick={() => toggleTicker(t)}
                            className={`mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                selected.includes(t)
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-hairline hover:bg-surface-elevated"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </section>

            {error && <p data-testid="compare-error" className="text-[13px] text-negative">{error}</p>}

            <section className="space-y-4">
                <button
                    data-testid="compare-btn"
                    onClick={handleCompare}
                    disabled={selected.length < 1 || loadingCompare}
                    className="text-[11px] uppercase tracking-wider px-4 py-2 rounded-full border border-hairline hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                    {loadingCompare ? "Cargando..." : "Comparar métricas"}
                </button>

                {compareData && (
                    <div data-testid="compare-table" className="card-modern overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-hairline text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <th className="px-5 py-3 text-left">Métrica</th>
                                    {compareData.map(c => (
                                        <th key={c.ticker} className="px-5 py-3 text-right mono">{c.ticker}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(["revenue", "net_income", "eps", "total_assets", "total_liabilities"] as const).map(metric => (
                                    <tr key={metric} className="border-b border-hairline last:border-0">
                                        <td className="px-5 py-3 text-muted-foreground capitalize">{metric.replace("_", " ")}</td>
                                        {compareData.map(c => (
                                            <td
                                                key={c.ticker}
                                                data-testid={`metric-${metric}-${c.ticker}`}
                                                className="px-5 py-3 text-right mono"
                                            >
                                                {c.financials_available ? fmt(c[metric as keyof MetricItem] as number | null) : "No disponible"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground">Métrica:</span>
                    {METRICS.map(m => (
                        <button
                            key={m}
                            data-testid={`metric-tab-${m}`}
                            onClick={() => setActiveMetric(m)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                activeMetric === m
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-hairline hover:bg-surface-elevated"
                            }`}
                        >
                            {m.replace("_", " ")}
                        </button>
                    ))}
                    <button
                        data-testid="history-btn"
                        onClick={handleHistory}
                        disabled={selected.length < 1 || loadingHistory}
                        className="text-[11px] uppercase tracking-wider px-4 py-2 rounded-full border border-hairline hover:bg-surface-elevated transition-colors disabled:opacity-50"
                    >
                        {loadingHistory ? "Cargando..." : "Ver evolución"}
                    </button>
                </div>

                {historyData && (
                    <div data-testid="history-table" className="card-modern overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-hairline text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <th className="px-5 py-3 text-left">Quarter</th>
                                    {historyData.map(h => (
                                        <th key={h.ticker} className="px-5 py-3 text-right mono">{h.ticker}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(
                                    new Set(historyData.flatMap(h => h.data_points.map(d => d.period_end)))
                                ).sort((a, b) => b.localeCompare(a)).map(period => (
                                    <tr key={period} className="border-b border-hairline last:border-0">
                                        <td className="px-5 py-3 mono text-muted-foreground">{period}</td>
                                        {historyData.map(h => {
                                            const dp = h.data_points.find(d => d.period_end === period);
                                            return (
                                                <td
                                                    key={h.ticker}
                                                    data-testid={`history-${h.ticker}-${period}`}
                                                    className="px-5 py-3 text-right mono"
                                                >
                                                    {dp ? fmt(dp.value) : "—"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 border-t border-hairline text-[11px] text-muted-foreground">
                            {historyData.map(h => (
                                <span key={h.ticker} data-testid={`quarters-available-${h.ticker}`} className="mr-4">
                                    {h.ticker}: {h.quarters_available} quarters
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}