"use client";

import { useState, useEffect } from "react";

type WatchlistItem = {
    id: number;
    ticker: string;
};

export default function WatchlistPage() {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [ticker, setTicker] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function fetchWatchlist() {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("/api/v1/watchlist/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setItems(await res.json());
        } catch {
            setError("No se pudo cargar la watchlist.");
        }
    }

    useEffect(() => { fetchWatchlist(); }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!ticker.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("/api/v1/watchlist/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ticker: ticker.trim().toUpperCase() }),
            });
            if (res.status === 409) {
                setError(`${ticker.toUpperCase()} ya está en tu watchlist.`);
                return;
            }
            if (!res.ok) throw new Error();
            setTicker("");
            await fetchWatchlist();
        } catch {
            setError("No se pudo agregar el ticker.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <header>
                <div className="chip mb-3">Watchlist</div>
                <h1 className="display text-5xl md:text-6xl grad-text">My watchlist</h1>
            </header>

            <form onSubmit={handleAdd} className="card-modern flex items-center gap-3 px-5 py-4 max-w-sm">
                <input
                    data-testid="watchlist-input"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="Add ticker… e.g. TSLA"
                    className="flex-1 bg-transparent text-sm mono placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={loading}
                    data-testid="watchlist-add-btn"
                    className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-hairline hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                    {loading ? "..." : "Add"}
                </button>
            </form>

            {error && (
                <p data-testid="watchlist-error" className="text-[13px] text-negative">
                    {error}
                </p>
            )}

            <div className="card-modern overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                    <span>Asset</span>
                </div>

                {items.length === 0 && (
                    <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                        Tu watchlist está vacía. ¡Agregá un ticker para empezar!
                    </div>
                )}

                {items.map((item) => (
                    <div
                        key={item.id}
                        data-testid={`watchlist-item-${item.ticker}`}
                        className="flex items-center gap-3 px-5 py-4 border-b border-hairline last:border-0 hover:bg-surface-elevated/60 transition-colors"
                    >
                        <div className="size-9 rounded-xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-[11px] shrink-0">
                            {item.ticker.slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{item.ticker}</span>
                    </div>
                ))}
            </div>
        </main>
    );
}