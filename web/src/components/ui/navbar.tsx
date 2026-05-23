"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/watchlist", label: "Watchlist" },
    { href: "/search", label: "Research" },
    { href: "/operations", label: "Activity" },
];

export function Navbar() {
    const pathname = usePathname();

    const isAuth = pathname === "/login" || pathname === "/register";
    if (isAuth) return null;

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-hairline">
            <div className="mx-auto max-w-6xl px-5 py-3.5 flex items-center justify-between gap-4">
                <Link href="/portfolio" className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg ring-grad flex items-center justify-center">
                        <div className="size-3 rounded-sm bg-background" />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight">StockWatch</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-hairline bg-surface/60">
                    {nav.map((n) => {
                        const active = pathname.startsWith(n.href);
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={`px-3.5 py-1.5 text-[13px] rounded-full transition-colors ${
                                    active
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>

                <nav className="md:hidden flex overflow-x-auto gap-1">
                    {nav.map((n) => {
                        const active = pathname.startsWith(n.href);
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={`px-3 py-1.5 text-[13px] rounded-full whitespace-nowrap ${
                                    active
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground border border-hairline"
                                }`}
                            >
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}