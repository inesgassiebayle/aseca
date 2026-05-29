import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const API_BASE = "http://10.0.2.2:8000";

type Company = { name: string; ticker: string; cik: number };

export default function SearchScreen() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Company[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/edgar/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data: Company[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} testID="search-title" accessibilityLabel="search-title">
        Search companies
      </Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Ticker or company name"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          testID="search-input"
          accessibilityLabel="search-input"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          testID="search-button"
          accessibilityLabel="search-button"
        >
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.error} testID="search-error" accessibilityLabel="search-error">
          {error}
        </Text>
      )}

      {loading && <ActivityIndicator testID="search-loading" accessibilityLabel="search-loading" />}

      {!loading && searched && results.length === 0 && (
        <Text style={styles.empty} testID="no-results" accessibilityLabel="no-results">
          No companies found for "{query}"
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.cik)}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            testID={`result-${index}`}
            accessibilityLabel={`result-${index}`}
            onPress={() =>
              router.push({
                pathname: "/company/[cik]",
                params: { cik: item.cik, ticker: item.ticker, name: item.name },
              })
            }
          >
            <View style={styles.cardRow}>
              <Text style={styles.ticker} testID={`ticker-${index}`} accessibilityLabel={`ticker-${index}`}>
                {item.ticker}
              </Text>
              <Text style={styles.cikLabel} testID={`cik-${index}`} accessibilityLabel={`cik-${index}`}>
                CIK {item.cik}
              </Text>
            </View>
            <Text style={styles.companyName} testID={`company-name-${index}`} accessibilityLabel={`company-name-${index}`}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#e00", marginBottom: 8, textAlign: "center" },
  empty: { textAlign: "center", color: "#555", marginTop: 24, fontSize: 15 },
  list: { marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  ticker: { fontWeight: "700", fontSize: 16 },
  cikLabel: { color: "#888", fontSize: 12 },
  companyName: { color: "#444", fontSize: 14 },
});