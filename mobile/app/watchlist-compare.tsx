import { useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:8000";

type WatchlistItem = { id: number; ticker: string; price: number | null; updated_at: string | null };
type MetricItem = {
    ticker: string;
    financials_available: boolean;
    revenue: number | null;
    net_income: number | null;
    eps: number | null;
    total_assets: number | null;
    total_liabilities: number | null;
};

function fmt(value: number | null): string {
    if (value === null) return "—";
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
}

const METRICS = ["revenue", "net_income", "eps", "total_assets", "total_liabilities"] as const;
const METRIC_LABELS: Record<string, string> = {
    revenue: "Revenue",
    net_income: "Net Income",
    eps: "EPS",
    total_assets: "Total Assets",
    total_liabilities: "Total Liabilities",
};

export default function WatchlistCompareScreen() {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [compareData, setCompareData] = useState<MetricItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingCompare, setLoadingCompare] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(useCallback(() => {
        async function fetchWatchlist() {
            try {
                const token = await AsyncStorage.getItem("access_token");
                const res = await fetch(`${API_BASE}/api/v1/watchlist/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                const data: WatchlistItem[] = await res.json();
                setWatchlist(data.map(i => i.ticker));
            } catch {
                setError("No se pudo cargar la watchlist.");
            } finally {
                setLoading(false);
            }
        }
        fetchWatchlist();
    }, []));

    function toggleTicker(t: string) {
        setSelected(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        );
    }

    async function handleCompare() {
        if (selected.length < 1) return;
        setLoadingCompare(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/watchlist/compare?tickers=${selected.join(",")}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setCompareData(await res.json());
        } catch {
            setError("No se pudieron obtener las métricas.");
        } finally {
            setLoadingCompare(false);
        }
    }

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" testID="compare-loading" accessibilityLabel="compare-loading" />
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.hero}>
                <Text style={styles.heroLabel}>Watchlist</Text>
                <Text style={styles.heroValue} testID="compare-title" accessibilityLabel="compare-title">
                    Compare
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Select companies:</Text>
                <View style={styles.tickerRow}>
                    {watchlist.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tickerBtn, selected.includes(t) && styles.tickerBtnActive]}
                            onPress={() => toggleTicker(t)}
                            testID={`ticker-btn-${t}`}
                            accessibilityLabel={`ticker-btn-${t}`}
                        >
                            <Text style={[styles.tickerBtnText, selected.includes(t) && styles.tickerBtnTextActive]}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {error && (
                <Text style={styles.error} testID="compare-error" accessibilityLabel="compare-error">
                    {error}
                </Text>
            )}

            <TouchableOpacity
                style={[styles.btnPrimary, selected.length < 1 && styles.btnDisabled]}
                onPress={handleCompare}
                disabled={selected.length < 1 || loadingCompare}
                testID="compare-metrics-btn"
                accessibilityLabel="compare-metrics-btn"
            >
                <Text style={styles.btnPrimaryText}>
                    {loadingCompare ? "Loading..." : "Compare metrics"}
                </Text>
            </TouchableOpacity>

            {compareData && (
                <View style={styles.table} testID="compare-table" accessibilityLabel="compare-table">
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Metric</Text>
                        {compareData.map(c => (
                            <Text
                                key={c.ticker}
                                style={[styles.tableCell, styles.tableHeaderText]}
                                testID={`compare-col-${c.ticker}`}
                                accessibilityLabel={`compare-col-${c.ticker}`}
                            >
                                {c.ticker}
                                {!c.financials_available && "\n⚠️"}
                            </Text>
                        ))}
                    </View>
                    {METRICS.map(metric => (
                        <View key={metric} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2, color: "#666" }]}>
                                {METRIC_LABELS[metric]}
                            </Text>
                            {compareData.map(c => (
                                <Text
                                    key={c.ticker}
                                    style={styles.tableCell}
                                    testID={`metric-${metric}-${c.ticker}`}
                                    accessibilityLabel={`metric-${metric}-${c.ticker}`}
                                >
                                    {c.financials_available
                                        ? fmt(c[metric as keyof MetricItem] as number | null)
                                        : "N/A"}
                                </Text>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    hero: { padding: 24, backgroundColor: "#000" },
    heroLabel: { color: "#aaa", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    heroValue: { color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 },
    section: { padding: 16 },
    sectionLabel: { fontSize: 13, color: "#666", marginBottom: 10 },
    tickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tickerBtn: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    tickerBtnActive: { backgroundColor: "#000", borderColor: "#000" },
    tickerBtnText: { fontSize: 13, fontWeight: "600", color: "#000" },
    tickerBtnTextActive: { color: "#fff" },
    btnPrimary: { margin: 16, backgroundColor: "#000", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
    btnDisabled: { backgroundColor: "#ccc" },
    btnPrimaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
    error: { color: "#e00", textAlign: "center", padding: 12 },
    table: { margin: 16, borderWidth: 1, borderColor: "#f0f0f0", borderRadius: 8, overflow: "hidden" },
    tableHeader: { flexDirection: "row", backgroundColor: "#f8f8f8", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    tableRow: { flexDirection: "row", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    tableCell: { flex: 1, fontSize: 12, textAlign: "right" },
    tableHeaderText: { fontWeight: "700", color: "#333" },
});