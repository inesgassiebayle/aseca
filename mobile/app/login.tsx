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

export default function LoginScreen() {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState<string | null>(null);
    const [loading, setLoading]   = useState(false);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.detail ?? "Invalid credentials");
                return;
            }

            await AsyncStorage.setItem("access_token", data.access_token);
            router.replace("/search");
        } catch {
            setError("Network error, please try again");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title} testID="title" accessibilityLabel="title">
                Sign in
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="email"
                accessibilityLabel="email"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="password"
                accessibilityLabel="password"
            />
            {error && (
                <Text style={styles.error} testID="error" accessibilityLabel="error">
                    {error}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                testID="submit"
                accessibilityLabel="submit"
            >
                <Text style={styles.buttonText}>
                    {loading ? "Signing in…" : "Sign in"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => router.push("/register")}
                testID="go-to-register"
                accessibilityLabel="go-to-register"
            >
                <Text style={styles.link}>No account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
    },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 32 },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
    },
    error: { color: "#e00", marginBottom: 12, textAlign: "center" },
    button: {
        width: "100%",
        backgroundColor: "#000",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 16,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    link: { color: "#555", fontSize: 14 },
});