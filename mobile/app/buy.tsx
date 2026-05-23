import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:8000";

export default function BuyScreen() {
    const [ticker, setTicker] = useState("");
    const [quantity, setQuantity] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError(null);
        if (!ticker || !quantity || Number(quantity) <= 0) {
            setError("Completá todos los campos.");
            return;
        }
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await fetch(`${API_BASE}/api/v1/portfolio/buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ticker: ticker.toUpperCase(), quantity: Number(quantity) }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.detail ?? "No se pudo registrar la compra.");
                return;
            }
            router.back();
        } catch {
            setError("Error de red.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title} testID="title">Comprar acciones</Text>

            <TextInput
                style={styles.input}
                placeholder="Ticker (ej: AAPL)"
                value={ticker}
                onChangeText={setTicker}
                autoCapitalize="characters"
                testID="ticker-input"
            />
            <TextInput
                style={styles.input}
                placeholder="Cantidad"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                testID="quantity-input"
            />

            {error && <Text style={styles.error} testID="error">{error}</Text>}

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                testID="submit"
            >
                <Text style={styles.buttonText}>{loading ? "Procesando…" : "Confirmar compra"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} testID="cancel">
                <Text style={styles.link}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 32 },
    input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 },
    error: { color: "#e00", marginBottom: 12, textAlign: "center" },
    button: { width: "100%", backgroundColor: "#000", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginBottom: 16 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    link: { color: "#555", fontSize: 14 },
});