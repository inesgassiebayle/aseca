"use client";

import { useState, useEffect } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultTicker?: string;
};

export function BuyDialog({ open, onClose, onSuccess, defaultTicker }: Props) {
    const [ticker, setTicker] = useState(defaultTicker ?? "");
    const [quantity, setQuantity] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTicker(defaultTicker ?? "");
    }, [defaultTicker]);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!ticker || !quantity || Number(quantity) <= 0) {
            setError("Completá todos los campos correctamente.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("/api/v1/portfolio/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ticker: ticker.toUpperCase(),
                    quantity: Number(quantity),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.detail ?? "No se pudo registrar la compra.");
                return;
            }

            setTicker(defaultTicker ?? "");
            setQuantity("");
            onSuccess();
            onClose();
        } catch {
            setError("Error de red, intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <form
                className="card-modern relative p-8 w-full max-w-sm space-y-5 z-10"
                onSubmit={handleSubmit}
            >
                <div>
                    <div className="chip mb-3">Trade</div>
                    <h2 className="display text-3xl">Comprar acciones</h2>
                </div>

                <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Ticker
                    </span>
                    <input
                        type="text"
                        placeholder="AAPL"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        required
                        disabled={!!defaultTicker}
                        className="w-full mt-1.5 bg-surface border border-hairline rounded-xl px-3 py-2.5 text-sm mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 disabled:opacity-50"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Cantidad
                    </span>
                    <input
                        type="number"
                        placeholder="10"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="w-full mt-1.5 bg-surface border border-hairline rounded-xl px-3 py-2.5 text-sm mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
                    />
                </label>

                {error && (
                    <p className="text-[13px] text-negative text-center">{error}</p>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 border border-hairline py-2.5 rounded-full text-[13px] font-medium hover:bg-surface-elevated transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-[13px] font-medium glow-primary disabled:opacity-50"
                    >
                        {loading ? "Procesando…" : "Confirmar"}
                    </button>
                </div>
            </form>
        </div>
    );
}