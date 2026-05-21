"use client";

import { useState, useEffect } from "react";
import {BuyDialog} from "@/components/ui/buy-dialog";

type Position = {
    id: number;
    ticker: string;
    quantity: number;
    avg_price: number;
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
            const res = await fetch("/api/v1/portfolio", {
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

            {error && (
                <p className="text-[13px] text-negative">{error}</p>
            )}

            <div className="card-modern overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                    <span>Asset</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Avg cost</span>
                </div>

                {positions.length === 0 && (
                    <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                        No tenés posiciones todavía. ¡Comprá tu primera acción!
                    </div>
                )}

                {positions.map((p) => (
                    <div
                        key={p.id}
                        className="grid md:grid-cols-[1.5fr_1fr_1fr] grid-cols-[1fr_1fr] gap-3 px-5 py-4 border-b border-hairline last:border-0 hover:bg-surface-elevated/60 transition-colors"
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
                    </div>
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