const COMPARE_MOCK_WATCHLIST = [
    { id: 1, ticker: "AAPL", price: 189.5, updated_at: "2025-01-01T12:00:00" },
    { id: 2, ticker: "MSFT", price: 420.0, updated_at: "2025-01-01T12:00:00" },
];

const MOCK_COMPARE = [
    {
        ticker: "AAPL",
        financials_available: true,
        revenue: 100_000_000_000,
        revenue_period: "2024-09-30",
        net_income: 20_000_000_000,
        net_income_period: "2024-09-30",
        eps: 1.5,
        eps_period: "2024-09-30",
        total_assets: 500_000_000_000,
        total_assets_period: "2024-09-30",
        total_liabilities: 200_000_000_000,
        total_liabilities_period: "2024-09-30",
    },
    {
        ticker: "MSFT",
        financials_available: false,
        revenue: null, revenue_period: null,
        net_income: null, net_income_period: null,
        eps: null, eps_period: null,
        total_assets: null, total_assets_period: null,
        total_liabilities: null, total_liabilities_period: null,
    },
];

const MOCK_HISTORY = [
    {
        ticker: "AAPL",
        quarters_available: 2,
        data_points: [
            { period_end: "2024-09-30", value: 100_000_000_000, form: "10-Q", filed: "2024-11-01" },
            { period_end: "2024-06-30", value: 95_000_000_000, form: "10-Q", filed: "2024-08-01" },
        ],
    },
    {
        ticker: "MSFT",
        quarters_available: 0,
        data_points: [],
    },
];

function interceptWatchlistCompare() {
    cy.intercept("GET", "/api/v1/watchlist/", { statusCode: 200, body: COMPARE_MOCK_WATCHLIST }).as("getWatchlist");
}

function interceptCompare() {
    cy.intercept("GET", /\/api\/v1\/watchlist\/compare\?tickers=/, {
        statusCode: 200,
        body: MOCK_COMPARE,
    }).as("getCompare");
}

function interceptHistory() {
    cy.intercept("GET", /\/api\/v1\/watchlist\/compare\/history/, {
        statusCode: 200,
        body: MOCK_HISTORY,
    }).as("getHistory");
}

// US-24 — Comparar métricas entre empresas de la watchlist
describe("US-24 — Comparar métricas", () => {
    beforeEach(() => {
        cy.login();
        interceptWatchlistCompare();
        cy.visit("/watchlist/compare");
        cy.wait("@getWatchlist");
    });

    it("muestra los tickers de la watchlist para seleccionar", () => {
        cy.get("[data-testid='ticker-btn-AAPL']").should("be.visible");
        cy.get("[data-testid='ticker-btn-MSFT']").should("be.visible");
    });

    it("muestra botón de comparar", () => {
        cy.get("[data-testid='compare-btn']").should("be.visible");
    });

    it("muestra la tabla de métricas al comparar", () => {
        interceptCompare();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='compare-btn']").click();
        cy.wait("@getCompare");
        cy.get("[data-testid='compare-table']").should("be.visible");
    });

    it("muestra el valor de revenue para AAPL", () => {
        interceptCompare();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='compare-btn']").click();
        cy.wait("@getCompare");
        cy.get("[data-testid='metric-revenue-AAPL']").should("contain", "100.00B");
    });

    it("muestra No disponible para empresa sin datos EDGAR", () => {
        interceptCompare();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='compare-btn']").click();
        cy.wait("@getCompare");
        cy.get("[data-testid='metric-revenue-MSFT']").should("contain", "No disponible");
    });
});

// US-25 — Ver evolución histórica comparada
describe("US-25 — Evolución histórica comparada", () => {
    beforeEach(() => {
        cy.login();
        interceptWatchlistCompare();
        cy.visit("/watchlist/compare");
        cy.wait("@getWatchlist");
    });

    it("muestra botón para ver evolución", () => {
        cy.get("[data-testid='history-btn']").should("be.visible");
    });

    it("muestra tabs de métricas", () => {
        cy.get("[data-testid='metric-tab-revenue']").should("be.visible");
        cy.get("[data-testid='metric-tab-net_income']").should("be.visible");
        cy.get("[data-testid='metric-tab-eps']").should("be.visible");
    });

    it("muestra la tabla histórica al hacer click", () => {
        interceptHistory();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='history-btn']").click();
        cy.wait("@getHistory");
        cy.get("[data-testid='history-table']").should("be.visible");
    });

    it("muestra los data points de AAPL", () => {
        interceptHistory();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='history-btn']").click();
        cy.wait("@getHistory");
        cy.get("[data-testid='history-AAPL-2024-09-30']").should("contain", "100.00B");
    });

    it("muestra quarters disponibles por empresa", () => {
        interceptHistory();
        cy.get("[data-testid='ticker-btn-AAPL']").click();
        cy.get("[data-testid='ticker-btn-MSFT']").click();
        cy.get("[data-testid='history-btn']").click();
        cy.wait("@getHistory");
        cy.get("[data-testid='quarters-available-AAPL']").should("contain", "2 quarters");
        cy.get("[data-testid='quarters-available-MSFT']").should("contain", "0 quarters");
    });

    it("cambia la métrica activa al clickear tab", () => {
        cy.get("[data-testid='metric-tab-net_income']").click();
        cy.get("[data-testid='metric-tab-net_income']").should("have.class", "text-primary");
    });
});