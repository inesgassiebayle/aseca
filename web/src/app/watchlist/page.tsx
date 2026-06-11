"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type WatchlistItem = {
    id: number;
    ticker: string;
    price: number | null;
    updated_at: string | null;
};

export default function WatchlistPage() {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [ticker, setTicker] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [whitelist, setWhitelist] = useState<string[]>([]);

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

    useEffect(() => {
        fetchWatchlist();
        fetch("/api/v1/watchlist/whitelist")
            .then(r => r.json())
            .then(setWhitelist);
    }, []);

    function handleTickerChange(value: string) {
        setTicker(value);
        if (value.trim().length === 0) {
            setSuggestions([]);
            return;
        }
        const filtered = whitelist
            .filter(t => t.startsWith(value.toUpperCase()))
            .slice(0, 6);
        setSuggestions(filtered);
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!ticker.trim()) return;
        setSuggestions([]);
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
            if (res.status === 422) {
                setError(`${ticker.toUpperCase()} no pertenece a la lista blanca.`);
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

    async function handleRemove(ticker: string) {
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`/api/v1/watchlist/${ticker}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            await fetchWatchlist();
        } catch {
            setError(`No se pudo eliminar ${ticker}.`);
        }
    }

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <header className="flex items-start justify-between">
                <div>
                    <div className="chip mb-3">Watchlist</div>
                    <h1 className="display text-5xl md:text-6xl grad-text">My watchlist</h1>
                </div>
                <Link
                    href="/watchlist/compare"
                    className="text-[11px] uppercase tracking-wider px-4 py-2 rounded-full border border-hairline hover:bg-surface-elevated transition-colors mt-2"
                >
                    Compare →
                </Link>
            </header>

            <div className="relative max-w-sm">
                <form onSubmit={handleAdd} className="card-modern flex items-center gap-3 px-5 py-4">
                    <input
                        data-testid="watchlist-input"
                        value={ticker}
                        onChange={(e) => handleTickerChange(e.target.value)}
                        placeholder="Add ticker… e.g. TSLA"
                        className="flex-1 bg-transparent text-sm mono placeholder:text-muted-foreground/60 focus:outline-none"
                        autoComplete="off"
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

                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 card-modern mt-1 overflow-hidden">
                        {suggestions.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => { setTicker(s); setSuggestions([]); }}
                                className="w-full text-left px-5 py-2.5 text-sm mono hover:bg-surface-elevated transition-colors border-b border-hairline last:border-0"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <p data-testid="watchlist-error" className="text-[13px] text-negative">
                    {error}
                </p>
            )}

            <div className="card-modern overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline">
                    <span>Asset</span>
                    <span>Last updated</span>
                    <span>Price</span>
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
                        <span className="text-sm font-medium flex-1">{item.ticker}</span>
                        <span
                            data-testid={`watchlist-updated-at-${item.ticker}`}
                            className="text-[11px] text-muted-foreground mono w-36 text-right"
                        >
                            {item.updated_at
                                ? new Date(item.updated_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
                                : "—"}
                        </span>
                        <span
                            data-testid={`watchlist-price-${item.ticker}`}
                            className={`text-sm mono w-20 text-right font-medium ${item.price === null ? "text-muted-foreground" : ""}`}
                        >
                            {item.price !== null ? `$${item.price.toFixed(2)}` : "N/A"}
                        </span>
                        <button
                            data-testid={`watchlist-remove-${item.ticker}`}
                            onClick={() => handleRemove(item.ticker)}
                            className="text-[11px] text-muted-foreground hover:text-negative transition-colors px-2 py-1 rounded"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}