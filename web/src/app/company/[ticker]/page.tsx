"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BuyDialog } from "@/components/ui/buy-dialog";
import { SellDialog } from "@/components/ui/sell-dialog";

type CompanyDetail = {
    ticker: string;
    name: string;
    cik: string;
    price: number | null;
    updated_at: string | null;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function CompanyPage() {
    const { ticker } = useParams<{ ticker: string }>();
    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [buyOpen, setBuyOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch(`/api/v1/edgar/company/${ticker}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setCompany(data);
            } catch {
                setError("No se pudo cargar la empresa.");
            }
        }
        fetchCompany();
    }, [ticker]);

    if (error) return (
        <main className="min-h-screen p-6 md:p-12">
            <p className="text-negative text-sm">{error}</p>
        </main>
    );

    if (!company) return (
        <main className="min-h-screen p-6 md:p-12">
            <p className="text-muted-foreground text-sm">Cargando...</p>
        </main>
    );

    return (
        <main className="min-h-screen p-6 md:p-12 space-y-8">
            <Link
                href="/search"
                className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
                ← Back
            </Link>

            {/* Hero */}
            <section className="card-modern p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-surface-elevated border border-hairline flex items-center justify-center mono text-sm font-medium shrink-0">
                            {ticker.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground mono mb-1">
                                <span>{ticker}</span>
                                {company.cik && <span>· CIK {company.cik}</span>}
                            </div>
                            <h1 className="display text-4xl md:text-5xl">{company.name}</h1>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-4">
                        {company.price && (
                            <div className="text-right">
                                <div className="display text-4xl">{fmtMoney(company.price)}</div>
                                {company.updated_at && (
                                    <div className="mono text-[11px] text-muted-foreground mt-1">
                                        Updated {new Date(company.updated_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBuyOpen(true)}
                                className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-[13px] font-medium glow-primary hover:opacity-90 transition-opacity"
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setSellOpen(true)}
                                className="border border-hairline px-5 py-2 rounded-full text-[13px] font-medium hover:bg-surface-elevated transition-colors"
                            >
                                Sell
                            </button>
                        </div>
                    </div>
                </div>
            </section>

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
        </main>
    );
}