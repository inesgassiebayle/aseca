import { useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:8000";

type WatchlistItem = {
    id: number;
    ticker: string;
    price: number | null;
    updated_at: string | null;
};

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function WatchlistScreen() {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticker, setTicker] = useState("");
    const [adding, setAdding] = useState(false);

    async function fetchWatchlist() {
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/watchlist/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setItems(await res.json());
        } catch {
            setError("No se pudo cargar la watchlist.");
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(useCallback(() => { fetchWatchlist(); }, []));

    async function handleAdd() {
        if (!ticker.trim()) return;
        setAdding(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/watchlist/`, {
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
            setAdding(false);
        }
    }

    async function handleRemove(t: string) {
        setError(null);
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/watchlist/${t}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            await fetchWatchlist();
        } catch {
            setError(`No se pudo eliminar ${t}.`);
        }
    }

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" testID="watchlist-loading" accessibilityLabel="watchlist-loading" />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.hero}>
                <Text style={styles.heroLabel}>Watchlist</Text>
                <Text style={styles.heroValue} testID="watchlist-title" accessibilityLabel="watchlist-title">
                    My watchlist
                </Text>
            </View>

            <View style={styles.addRow}>
                <TextInput
                    style={styles.input}
                    value={ticker}
                    onChangeText={setTicker}
                    placeholder="Add ticker… e.g. TSLA"
                    autoCapitalize="characters"
                    testID="watchlist-input"
                    accessibilityLabel="watchlist-input"
                />
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={handleAdd}
                    disabled={adding}
                    testID="watchlist-add-btn"
                    accessibilityLabel="watchlist-add-btn"
                >
                    <Text style={styles.btnPrimaryText}>{adding ? "..." : "Add"}</Text>
                </TouchableOpacity>
            </View>

            {error && (
                <Text style={styles.error} testID="watchlist-error" accessibilityLabel="watchlist-error">
                    {error}
                </Text>
            )}

            <TouchableOpacity
                style={styles.compareBtn}
                onPress={() => router.push("/watchlist-compare")}
                testID="compare-btn"
                accessibilityLabel="compare-btn"
            >
                <Text style={styles.compareBtnText}>Compare →</Text>
            </TouchableOpacity>

            {items.length === 0 ? (
                <Text style={styles.empty} testID="watchlist-empty" accessibilityLabel="watchlist-empty">
                    Tu watchlist está vacía. ¡Agregá un ticker para empezar!
                </Text>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(i) => i.ticker}
                    renderItem={({ item }) => (
                        <View
                            style={styles.row}
                            testID={`watchlist-item-${item.ticker}`}
                            accessibilityLabel={`watchlist-item-${item.ticker}`}
                        >
                            <View style={styles.rowLeft}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.ticker.slice(0, 2)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.ticker}>{item.ticker}</Text>
                                    {item.updated_at && (
                                        <Text style={styles.updatedAt}>
                                            {new Date(item.updated_at).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.rowRight}>
                                <Text
                                    style={styles.price}
                                    testID={`watchlist-price-${item.ticker}`}
                                    accessibilityLabel={`watchlist-price-${item.ticker}`}
                                >
                                    {item.price !== null ? fmtMoney(item.price) : "N/A"}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleRemove(item.ticker)}
                                    testID={`watchlist-remove-${item.ticker}`}
                                    accessibilityLabel={`watchlist-remove-${item.ticker}`}
                                >
                                    <Text style={styles.removeBtn}>✕</Text>
                                </TouchableOpacity>
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
    hero: { padding: 24, backgroundColor: "#000" },
    heroLabel: { color: "#aaa", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    heroValue: { color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 },
    addRow: { flexDirection: "row", gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    btnPrimary: { backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: "center" },
    btnPrimaryText: { color: "#fff", fontWeight: "600" },
    compareBtn: { margin: 16, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    compareBtnText: { color: "#000", fontWeight: "600", fontSize: 13 },
    error: { color: "#e00", textAlign: "center", padding: 12 },
    empty: { textAlign: "center", color: "#888", marginTop: 40, paddingHorizontal: 24 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 12, fontWeight: "600" },
    ticker: { fontSize: 15, fontWeight: "600" },
    updatedAt: { fontSize: 11, color: "#888", marginTop: 2 },
    rowRight: { alignItems: "flex-end", gap: 4 },
    price: { fontSize: 15, fontWeight: "600" },
    removeBtn: { color: "#888", fontSize: 14, padding: 4 },
});