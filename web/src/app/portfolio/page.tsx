"use client";

import { useState, useEffect } from "react";
import { BuyDialog } from "@/components/ui/buy-dialog";
import Link from "next/link";

type Position = {
    id: number;
    ticker: string;
    quantity: number;
    avg_price: number;
    current_price: number | null;
    current_value: number | null;
    price_updated_at: string | null;
    pnl: number | null;
    pnl_pct: number | null;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function PortfolioPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [buyOpen, setBuyOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchPortfolio() {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("/api/v1/portfolio/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPositions(data);
        } catch {
            setError("No se pudo cargar el portfolio.");
        }
    }

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const totalValue = positions.reduce((s, p) => s + (p.current_value ?? 0), 0);
    const lastUpdate = positions
        .map((p) => p.price_updated_at)
        .filter(Boolean)
        .sort()
        .at(-1);

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <div className="chip mb-3">Portfolio</div>
                    <h1 className="display text-5xl md:text-6xl grad-text">My holdings</h1>
                </div>
                <button
                    onClick={() => setBuyOpen(true)}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-[13px] font-medium glow-primary hover:opacity-90 transition-opacity"
                >
                    + New position
                </button>
            </header>

            {/* Total value */}
            {positions.length > 0 && (
                <section className="card-modern p-8">
                    <div className="chip mb-3">Total portfolio value</div>
                    <div className="display text-5xl md:text-6xl grad-text">{fmtMoney(totalValue)}</div>
                    {lastUpdate && (
                        <p className="mono text-[11px] text-muted-foreground mt-3">
                            Prices updated {new Date(lastUpdate).toLocaleString()}
                        </p>
                    )}
                </section>
            )}

            {error && <p className="text-[13px] text-negative">{error}</p>}

            <div className="card-modern overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                    <span>Asset</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Avg cost</span>
                    <span className="text-right">Value</span>
                    <span className="text-right">P&L</span>
                </div>

                {positions.length === 0 && (
                    <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                        No tenés posiciones todavía. ¡Comprá tu primera acción!
                    </div>
                )}

                {positions.map((p) => (
                    <Link
                        key={p.id}
                        href={`/portfolio/${p.ticker}`}
                        className="grid md:grid-cols-[1.5fr_0.8fr_0.8fr_1fr_1fr] grid-cols-[1fr_1fr] gap-3 px-5 py-4 border-b border-hairline last:border-0 hover:bg-surface-elevated/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-[11px] shrink-0">
                                {p.ticker.slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium">{p.ticker}</span>
                        </div>
                        <div className="mono text-sm text-right self-center">{p.quantity}</div>
                        <div className="mono text-sm text-right self-center text-muted-foreground">
                            {fmtMoney(p.avg_price)}
                        </div>
                        <div className="mono text-sm text-right self-center">
                            {p.current_value ? fmtMoney(p.current_value) : "—"}
                        </div>
                        <div className="self-center text-right">
                            {p.pnl !== null ? (
                                <>
                                    <div className={`mono text-sm ${p.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                                        {p.pnl >= 0 ? "+" : ""}{fmtMoney(p.pnl)}
                                    </div>
                                    <div className={`mono text-[11px] ${p.pnl >= 0 ? "text-positive/70" : "text-negative/70"}`}>
                                        {p.pnl_pct !== null ? `${p.pnl_pct >= 0 ? "+" : ""}${p.pnl_pct.toFixed(2)}%` : ""}
                                    </div>
                                </>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            <BuyDialog
                open={buyOpen}
                onClose={() => setBuyOpen(false)}
                onSuccess={fetchPortfolio}
            />
        </main>
    );
}