"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Operation = {
    id: number;
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    executed_at: string;
};

type PositionDetail = {
    ticker: string;
    quantity: number;
    avg_price: number;
    current_price: number | null;
    pnl: number | null;
    operations: Operation[];
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
}

export default function PositionDetailPage() {
    const { ticker } = useParams<{ ticker: string }>();
    const [detail, setDetail] = useState<PositionDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetail() {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`/api/v1/portfolio/${ticker}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                setDetail(data);
            } catch {
                setError("No se pudo cargar el detalle de la posición.");
            }
        }
        fetchDetail();
    }, [ticker]);

    if (error) return (
        <main className="min-h-screen p-6 md:p-12">
            <p className="text-negative text-sm">{error}</p>
        </main>
    );

    if (!detail) return (
        <main className="min-h-screen p-6 md:p-12">
            <p className="text-muted-foreground text-sm">Cargando...</p>
        </main>
    );

    const pnlUp = detail.pnl !== null && detail.pnl >= 0;

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <Link
                href="/portfolio"
                className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
                ← Portfolio
            </Link>

            {/* Hero */}
            <section className="card-modern p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm font-medium shrink-0">
                            {ticker.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="chip mb-1">{ticker}</div>
                            <h1 className="display text-4xl grad-text">{detail.quantity} shares</h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-hairline bg-surface/60 p-4">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg cost</span>
                            <div className="mono text-base mt-2">{fmtMoney(detail.avg_price)}</div>
                        </div>
                        <div className="rounded-2xl border border-hairline bg-surface/60 p-4">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Current price</span>
                            <div className="mono text-base mt-2">{detail.current_price ? fmtMoney(detail.current_price) : "—"}</div>
                        </div>
                        <div className="rounded-2xl border border-hairline bg-surface/60 p-4 col-span-2 md:col-span-1">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">P&L</span>
                            <div className={`mono text-base mt-2 ${detail.pnl !== null ? (pnlUp ? "text-positive" : "text-negative") : ""}`}>
                                {detail.pnl !== null ? fmtMoney(detail.pnl) : "—"}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Operations */}
            <section>
                <header className="flex items-baseline justify-between mb-4 px-1">
                    <h2 className="text-xl font-medium">Operations</h2>
                    <span className="chip">{detail.operations.length} transactions</span>
                </header>

                <div className="card-modern overflow-hidden">
                    <div className="hidden md:grid grid-cols-[120px_80px_1fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                        <span>Date</span>
                        <span>Type</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">Total</span>
                    </div>

                    {detail.operations.length === 0 && (
                        <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                            No hay operaciones registradas.
                        </div>
                    )}

                    {detail.operations.map((op) => (
                        <div
                            key={op.id}
                            className="grid md:grid-cols-[120px_80px_1fr_1fr_1fr] grid-cols-[auto_1fr_auto] gap-3 px-5 py-4 border-b border-hairline last:border-0 hover:bg-surface-elevated/60 transition-colors"
                        >
                            <div className="mono text-xs text-muted-foreground self-center">{fmtDate(op.executed_at)}</div>
                            <div className="self-center">
                                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                    op.type === "buy"
                                        ? "bg-positive/15 text-positive"
                                        : "bg-negative/15 text-negative"
                                }`}>
                                    {op.type === "buy" ? "BUY" : "SELL"}
                                </span>
                            </div>
                            <div className="mono text-sm text-right self-center hidden md:block">{op.quantity}</div>
                            <div className="mono text-sm text-right self-center hidden md:block">{fmtMoney(op.price)}</div>
                            <div className="mono text-sm text-right self-center">{fmtMoney(op.quantity * op.price)}</div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}