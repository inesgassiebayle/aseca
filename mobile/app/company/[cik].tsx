import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const API_BASE = "http://10.0.2.2:8000";

type Metric     = { concept: string; value: number; unit: string; period: string } | null;
type Financials = {
  financials_available: boolean;
  from_cache: boolean;
  revenue: Metric;
  net_income: Metric;
  eps: Metric;
  total_assets: Metric;
  total_liabilities: Metric;
};
type Filing    = { type: string; date: string; url: string };
type DataPoint = { period_end: string; value: number; form: string };
type MetricKey = "revenue" | "net_income" | "eps";

const METRIC_LABELS: Record<MetricKey, string> = {
  revenue:    "Revenue",
  net_income: "Net Income",
  eps:        "EPS",
};

function formatVal(value: number, unit: string): string {
  if (unit === "USD" || unit === "USD/shares") {
    if (Math.abs(value) >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
    if (Math.abs(value) >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
    return "$" + value.toFixed(2);
  }
  return value.toFixed(2);
}

function MetricRow({ label, m, testID }: { label: string; m: Metric; testID: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      {m ? (
        <View style={styles.metricRight}>
          <Text style={styles.metricValue} testID={testID} accessibilityLabel={testID}>
            {formatVal(m.value, m.unit)}
          </Text>
          <Text style={styles.metricPeriod}>{m.period}</Text>
        </View>
      ) : (
        <Text style={styles.metricUnavailable} testID={testID} accessibilityLabel={testID}>—</Text>
      )}
    </View>
  );
}

export default function CompanyDetailScreen() {
  const { cik, ticker, name } = useLocalSearchParams<{
    cik: string;
    ticker: string;
    name: string;
  }>();

  const [price, setPrice]               = useState<number | null | undefined>(undefined);
  const [financials, setFinancials]     = useState<Financials | null>(null);
  const [filings, setFilings]           = useState<Filing[]>([]);
  const [filingsMsg, setFilingsMsg]     = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("revenue");
  const [metricData, setMetricData]     = useState<DataPoint[]>([]);

  const [loadingPrice, setLoadingPrice]           = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [loadingFilings, setLoadingFilings]       = useState(true);
  const [loadingMetric, setLoadingMetric]         = useState(true);

  useEffect(() => {
    if (!ticker) return;
    fetch(`${API_BASE}/api/v1/prices/${ticker}`)
      .then((r) => r.json())
      .then((d) => setPrice(d.price ?? null))
      .catch(() => setPrice(null))
      .finally(() => setLoadingPrice(false));
  }, [ticker]);

  useEffect(() => {
    if (!cik) return;
    fetch(`${API_BASE}/api/v1/edgar/company/${cik}/financials?ticker=${ticker ?? ""}`)
      .then((r) => r.json())
      .then(setFinancials)
      .catch(() => setFinancials(null))
      .finally(() => setLoadingFinancials(false));
  }, [cik]);

  useEffect(() => {
    if (!cik) return;
    fetch(`${API_BASE}/api/v1/edgar/companies/${cik}/filings`)
      .then((r) => r.json())
      .then((d) => {
        setFilings(d.filings ?? []);
        setFilingsMsg(d.message ?? null);
      })
      .catch(() => setFilingsMsg("Could not load filings"))
      .finally(() => setLoadingFilings(false));
  }, [cik]);

  useEffect(() => {
    if (!cik) return;
    setLoadingMetric(true);
    fetch(`${API_BASE}/api/v1/edgar/companies/${cik}/metrics/${activeMetric}`)
      .then((r) => r.json())
      .then((d) => setMetricData(d.data_points ?? []))
      .catch(() => setMetricData([]))
      .finally(() => setLoadingMetric(false));
  }, [cik, activeMetric]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.tickerText} testID="ticker" accessibilityLabel="ticker">{ticker}</Text>
          <Text style={styles.cikText} testID="cik" accessibilityLabel="cik">CIK {cik}</Text>
        </View>
        <View style={styles.priceBox}>
          {loadingPrice ? (
            <ActivityIndicator testID="price-loading" accessibilityLabel="price-loading" />
          ) : price !== null && price !== undefined ? (
            <Text style={styles.price} testID="price" accessibilityLabel="price">
              ${price.toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.priceUnavailable} testID="price-unavailable" accessibilityLabel="price-unavailable">
              Price not available
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.companyName} testID="company-name" accessibilityLabel="company-name">{name}</Text>

      <Text style={styles.sectionTitle}>Financial data · SEC EDGAR</Text>
      {loadingFinancials ? (
        <ActivityIndicator testID="financials-loading" accessibilityLabel="financials-loading" />
      ) : !financials || !financials.financials_available ? (
        <Text style={styles.empty} testID="no-financials" accessibilityLabel="no-financials">
          No XBRL financial data available
        </Text>
      ) : (
        <View style={styles.card} testID="financials-card" accessibilityLabel="financials-card">
          <MetricRow label="Revenue"           m={financials.revenue}           testID="revenue" />
          <MetricRow label="Net Income"        m={financials.net_income}        testID="net-income" />
          <MetricRow label="EPS (basic)"       m={financials.eps}               testID="eps" />
          <MetricRow label="Total Assets"      m={financials.total_assets}      testID="total-assets" />
          <MetricRow label="Total Liabilities" m={financials.total_liabilities} testID="total-liabilities" />
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent filings</Text>
      {loadingFilings ? (
        <ActivityIndicator testID="filings-loading" accessibilityLabel="filings-loading" />
      ) : filingsMsg ? (
        <Text style={styles.empty} testID="no-filings" accessibilityLabel="no-filings">{filingsMsg}</Text>
      ) : (
        <View testID="filings-list" accessibilityLabel="filings-list">
          {filings.slice(0, 5).map((f, i) => (
            <View key={i} style={styles.filingRow} testID={`filing-${i}`} accessibilityLabel={`filing-${i}`}>
              <Text style={styles.filingType}>{f.type}</Text>
              <Text style={styles.filingDate}>{f.date}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Metric history</Text>
      <View style={styles.metricTabs}>
        {(["revenue", "net_income", "eps"] as MetricKey[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, activeMetric === m && styles.tabActive]}
            onPress={() => setActiveMetric(m)}
            testID={`metric-tab-${m}`}
            accessibilityLabel={`metric-tab-${m}`}
          >
            <Text style={[styles.tabText, activeMetric === m && styles.tabTextActive]}>
              {METRIC_LABELS[m]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingMetric ? (
        <ActivityIndicator testID="metric-loading" accessibilityLabel="metric-loading" />
      ) : metricData.length === 0 ? (
        <Text style={styles.empty} testID="no-metric-data" accessibilityLabel="no-metric-data">
          No historical data available
        </Text>
      ) : (
        <View testID="metric-data" accessibilityLabel="metric-data">
          {metricData.map((dp, i) => (
            <View key={i} style={styles.dpRow} testID={`datapoint-${i}`} accessibilityLabel={`datapoint-${i}`}>
              <Text style={styles.dpPeriod}>{dp.period_end}</Text>
              <Text style={styles.dpValue}>{formatVal(dp.value, "USD")}</Text>
              <Text style={styles.dpForm}>{dp.form}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  tickerText: { fontSize: 20, fontWeight: "700" },
  cikText: { color: "#888", fontSize: 12 },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "700" },
  priceUnavailable: { color: "#888", fontSize: 13 },
  companyName: { fontSize: 16, color: "#444", marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 12 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  metricLabel: { fontSize: 14, color: "#555" },
  metricRight: { alignItems: "flex-end" },
  metricValue: { fontSize: 14, fontWeight: "600" },
  metricPeriod: { fontSize: 11, color: "#888" },
  metricUnavailable: { color: "#aaa", fontSize: 14 },
  empty: { color: "#888", textAlign: "center", marginVertical: 12, fontSize: 14 },
  filingRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  filingType: { fontWeight: "600", fontSize: 13, backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  filingDate: { color: "#555", fontSize: 13 },
  metricTabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  tabActive: { backgroundColor: "#000", borderColor: "#000" },
  tabText: { fontSize: 13, color: "#555" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  dpRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dpPeriod: { color: "#555", fontSize: 13, flex: 1 },
  dpValue: { fontWeight: "600", fontSize: 13, flex: 1, textAlign: "center" },
  dpForm: { color: "#888", fontSize: 12, flex: 0.5, textAlign: "right" },
});