import { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:8000";

type Position = {
    id: number;
    ticker: string;
    quantity: number;
    avg_price: number;
    current_price: number | null;
    current_value: number | null;
    pnl: number | null;
    pnl_pct: number | null;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function PortfolioScreen() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchPortfolio() {
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/portfolio/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPositions(data);
        } catch {
            setError("No se pudo cargar el portfolio.");
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(useCallback(() => { fetchPortfolio(); }, []));

    const totalValue = positions.reduce((s, p) => s + (p.current_value ?? 0), 0);
    const totalPnl = positions.reduce((s, p) => s + (p.pnl ?? 0), 0);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Hero */}
            <View style={styles.hero}>
                <Text style={styles.heroLabel}>Total portfolio value</Text>
                <Text style={styles.heroValue} testID="total-value">{fmtMoney(totalValue)}</Text>
                <Text style={[styles.heroPnl, { color: totalPnl >= 0 ? "#22c55e" : "#ef4444" }]} testID="total-pnl">
                    {totalPnl >= 0 ? "+" : ""}{fmtMoney(totalPnl)}
                </Text>
            </View>

            {/* Botones */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/buy")} testID="buy-button">
                    <Text style={styles.btnPrimaryText}>+ Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push("/operations")} testID="operations-button">
                    <Text style={styles.btnSecondaryText}>Activity</Text>
                </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            {positions.length === 0 ? (
                <Text style={styles.empty} testID="empty-message">No tenés posiciones todavía.</Text>
            ) : (
                <FlatList
                    data={positions}
                    keyExtractor={(p) => p.ticker}
                    renderItem={({ item: p }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => router.push({ pathname: "/sell", params: { ticker: p.ticker } })}
                            testID={`position-${p.ticker}`}
                        >
                            <View style={styles.rowLeft}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{p.ticker.slice(0, 2)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.ticker}>{p.ticker}</Text>
                                    <Text style={styles.qty}>{p.quantity} shares</Text>
                                </View>
                            </View>
                            <View style={styles.rowRight}>
                                <Text style={styles.value}>{p.current_value ? fmtMoney(p.current_value) : "—"}</Text>
                                {p.pnl !== null && (
                                    <Text style={[styles.pnl, { color: p.pnl >= 0 ? "#22c55e" : "#ef4444" }]}>
                                        {p.pnl >= 0 ? "+" : ""}{fmtMoney(p.pnl)}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    hero: { padding: 24, backgroundColor: "#000" },
    heroLabel: { color: "#aaa", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    heroValue: { color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 },
    heroPnl: { fontSize: 16, fontWeight: "600", marginTop: 4 },
    actions: { flexDirection: "row", gap: 12, padding: 16 },
    btnPrimary: { flex: 1, backgroundColor: "#000", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
    btnPrimaryText: { color: "#fff", fontWeight: "600" },
    btnSecondary: { flex: 1, borderWidth: 1, borderColor: "#ccc", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
    btnSecondaryText: { color: "#000", fontWeight: "600" },
    error: { color: "#e00", textAlign: "center", padding: 16 },
    empty: { textAlign: "center", color: "#888", marginTop: 40 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 12, fontWeight: "600" },
    ticker: { fontSize: 15, fontWeight: "600" },
    qty: { fontSize: 12, color: "#888", marginTop: 2 },
    rowRight: { alignItems: "flex-end" },
    value: { fontSize: 15, fontWeight: "600" },
    pnl: { fontSize: 12, marginTop: 2 },
});