import { Stack } from "expo-router";
export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: "Aseca", headerShown: false }} />
            <Stack.Screen name="search" options={{ title: "Search companies" }} />
            <Stack.Screen name="login" options={{ title: "Sign in" }} />
            <Stack.Screen name="register" options={{ title: "Create account" }} />
            <Stack.Screen name="portfolio" options={{ title: "Portfolio" }} />
            <Stack.Screen name="buy" options={{ title: "Buy" }} />
            <Stack.Screen name="sell" options={{ title: "Sell" }} />
            <Stack.Screen name="operations" options={{ title: "Activity" }} />
            <Stack.Screen name="watchlist" options={{ title: "Watchlist" }} />
            <Stack.Screen name="watchlist-compare" options={{ title: "Compare", headerBackTitle: "Watchlist" }} />
            <Stack.Screen
                name="company/[cik]"
                options={{ title: "Company detail", headerBackTitle: "Back" }}
            />
        </Stack>
    );
}