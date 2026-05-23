import { useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:8000";

type Operation = {
    id: number;
    ticker: string;
    type: string;
    quantity: number;
    price: number;
    executed_at: string;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OperationsScreen() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(useCallback(() => {
        async function fetchOperations() {
            try {
                const token = await AsyncStorage.getItem("access_token");
                const res = await fetch(`${API_BASE}/api/v1/operations/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                setOperations(data);
            } catch {
                setError("No se pudo cargar el historial.");
            } finally {
                setLoading(false);
            }
        }
        fetchOperations();
    }, []));

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activity</Text>
                <TouchableOpacity onPress={() => router.back()} testID="back-button">
                    <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            {operations.length === 0 ? (
                <Text style={styles.empty} testID="empty-message">No hay operaciones registradas.</Text>
            ) : (
                <FlatList
                    data={operations}
                    keyExtractor={(o) => o.id.toString()}
                    renderItem={({ item: op }) => (
                        <View style={styles.row} testID={`operation-${op.id}`}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.badge, { backgroundColor: op.type === "buy" ? "#dcfce7" : "#fee2e2" }]}>
                                    <Text style={[styles.badgeText, { color: op.type === "buy" ? "#16a34a" : "#dc2626" }]}>
                                        {op.type === "buy" ? "BUY" : "SELL"}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.ticker}>{op.ticker}</Text>
                                    <Text style={styles.date}>{fmtDate(op.executed_at)}</Text>
                                </View>
                            </View>
                            <View style={styles.rowRight}>
                                <Text style={styles.total}>{fmtMoney(op.quantity * op.price)}</Text>
                                <Text style={styles.qty}>{op.quantity} @ {fmtMoney(op.price)}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    title: { fontSize: 20, fontWeight: "bold" },
    back: { color: "#555", fontSize: 14 },
    error: { color: "#e00", textAlign: "center", padding: 16 },
    empty: { textAlign: "center", color: "#888", marginTop: 40 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: "700" },
    ticker: { fontSize: 15, fontWeight: "600" },
    date: { fontSize: 12, color: "#888", marginTop: 2 },
    rowRight: { alignItems: "flex-end" },
    total: { fontSize: 15, fontWeight: "600" },
    qty: { fontSize: 12, color: "#888", marginTop: 2 },
});