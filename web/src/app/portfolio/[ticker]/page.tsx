"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BuyDialog } from "@/components/ui/buy-dialog";
import { SellDialog } from "@/components/ui/sell-dialog";

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
    pnl_pct: number | null;
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
    const router = useRouter();
    const [detail, setDetail] = useState<PositionDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [buyOpen, setBuyOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);

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

    useEffect(() => {
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
        <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
            <button
                onClick={() => router.push("/portfolio")}
                className="chip hover:text-foreground transition-colors w-fit"
            >
                ← Back
            </button>

            {/* Hero — same layout as Lovable company detail */}
            <section className="card-modern relative overflow-hidden p-8 noise">
                <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 md:items-end">
                    {/* Left: avatar + ticker + shares */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-12 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm shrink-0">
                                {ticker.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="mono text-xs text-muted-foreground">{ticker.toUpperCase()}</div>
                            </div>
                        </div>
                        <h1 className="display text-4xl md:text-6xl grad-text leading-[1]">
                            {detail.quantity} shares
                        </h1>
                    </div>

                    {/* Right: price + pnl + buttons */}
                    <div className="md:text-right">
                        <div className="mono text-4xl">
                            {detail.current_price ? `$${detail.current_price.toFixed(2)}` : "—"}
                        </div>
                        {detail.pnl !== null && (
                            <div className={`mono text-sm mt-1 ${pnlUp ? "text-positive" : "text-negative"}`}>
                                {pnlUp ? "+" : ""}{fmtMoney(detail.pnl)}
                                {detail.pnl_pct != null && (
                                    <span className="ml-1">({pnlUp ? "+" : ""}{Number(detail.pnl_pct).toFixed(2)}%)</span>
                                )}
                            </div>
                        )}
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
                            <button
                                className="size-9 border border-hairline rounded-full hover:bg-surface-elevated transition-colors flex items-center justify-center"
                                title="Add to watchlist"
                            >
                                ☆
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics cards */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="card-modern p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg cost</p>
                    <p className="mono text-2xl mt-2">{fmtMoney(detail.avg_price)}</p>
                </div>
                <div className="card-modern p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current price</p>
                    <p className="mono text-2xl mt-2">{detail.current_price ? `$${detail.current_price.toFixed(2)}` : "—"}</p>
                </div>
                <div className="card-modern p-4 col-span-2 md:col-span-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">P&L</p>
                    <p className={`mono text-2xl mt-2 ${detail.pnl !== null ? (pnlUp ? "text-positive" : "text-negative") : ""}`}>
                        {detail.pnl !== null ? fmtMoney(detail.pnl) : "—"}
                    </p>
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

            <BuyDialog
                open={buyOpen}
                onClose={() => setBuyOpen(false)}
                onSuccess={() => fetchDetail()}
                defaultTicker={ticker.toUpperCase()}
            />

            <SellDialog
                ticker={sellOpen ? ticker : null}
                onClose={() => setSellOpen(false)}
                onSuccess={() => {
                    fetchDetail();
                    if (detail.quantity <= 1) router.push("/portfolio");
                }}
            />
        </main>
    );
}