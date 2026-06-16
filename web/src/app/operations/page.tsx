"use client";

import { useState, useEffect } from "react";

type Operation = {
    id: number;
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    executed_at: string;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
}

export default function OperationsPage() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [ticker, setTicker] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function fetchOperations(filter?: string) {
        try {
            const token = localStorage.getItem("access_token");
            const url = filter
                ? `/api/v1/operations/?ticker=${filter.toUpperCase()}`
                : "/api/v1/operations/";
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setOperations(data);
        } catch {
            setError("No se pudo cargar el historial.");
        }
    }

    useEffect(() => {
        fetchOperations();
    }, []);

    function handleFilter(e: React.FormEvent) {
        e.preventDefault();
        fetchOperations(ticker || undefined);
    }

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <header>
                <div className="chip mb-3">Activity</div>
                <h1 data-cy="transactions-title" className="display text-5xl md:text-6xl grad-text">Transactions</h1>
            </header>

            <form onSubmit={handleFilter} className="card-modern flex items-center gap-3 px-5 py-4 max-w-sm">
                <input
                    data-cy="filter-ticker-input"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="Filter by ticker…"
                    className="flex-1 bg-transparent text-sm mono placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                    type="submit"
                    className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-hairline hover:bg-surface-elevated transition-colors"
                >
                    Filter
                </button>
                {ticker && (
                    <button
                        type="button"
                        onClick={() => { setTicker(""); fetchOperations(); }}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕
                    </button>
                )}
            </form>

            {error && <p className="text-[13px] text-negative">{error}</p>}

            <div className="card-modern overflow-hidden">
                <div className="hidden md:grid grid-cols-[120px_80px_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Asset</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Total</span>
                </div>

                {operations.length === 0 && (
                    <div data-cy="empty-operations-message" className="px-5 py-10 text-center text-muted-foreground text-sm">
                        No hay operaciones registradas todavía.
                    </div>
                )}

                {operations.map((op) => (
                    <div
                        key={op.id}
                        className="grid md:grid-cols-[120px_80px_1fr_1fr_1fr_1fr] grid-cols-[auto_1fr_auto] gap-3 px-5 py-4 border-b border-hairline last:border-0 hover:bg-surface-elevated/60 transition-colors"
                    >
                        <div className="mono text-xs text-muted-foreground self-center">
                            {fmtDate(op.executed_at)}
                        </div>
                        <div className="self-center">
                            <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                op.type === "buy"
                                    ? "bg-positive/15 text-positive"
                                    : "bg-negative/15 text-negative"
                            }`}>
                                {op.type === "buy" ? "BUY" : "SELL"}
                            </span>
                        </div>
                        <div className="text-sm font-medium self-center mono">{op.ticker}</div>
                        <div className="mono text-sm text-right self-center hidden md:block">{op.quantity}</div>
                        <div className="mono text-sm text-right self-center hidden md:block">{fmtMoney(op.price)}</div>
                        <div className="mono text-sm text-right self-center">{fmtMoney(op.quantity * op.price)}</div>
                    </div>
                ))}
            </div>
        </main>
    );
}