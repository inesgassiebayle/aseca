const MOCK_FINANCIALS = {
  cik: "320193",
  ticker: "AAPL",
  price: 189.3,
  price_last_updated: "2024-06-01T12:00:00",
  financials_available: true,
  from_cache: false,
  revenue: { concept: "Revenues", value: 383285000000, unit: "USD", period: "2023-09-30" },
  net_income: { concept: "NetIncomeLoss", value: 96995000000, unit: "USD", period: "2023-09-30" },
  eps: { concept: "EarningsPerShareBasic", value: 6.13, unit: "USD/shares", period: "2023-09-30" },
  total_assets: { concept: "Assets", value: 352583000000, unit: "USD", period: "2023-09-30" },
  total_liabilities: { concept: "Liabilities", value: 290437000000, unit: "USD", period: "2023-09-30" },
};

const MOCK_FINANCIALS_NO_PRICE = {
  ...MOCK_FINANCIALS,
  price: null,
  price_last_updated: null,
};

const MOCK_FINANCIALS_NO_XBRL = {
  ...MOCK_FINANCIALS,
  financials_available: false,
  revenue: null,
  net_income: null,
  eps: null,
  total_assets: null,
  total_liabilities: null,
};

const MOCK_FINANCIALS_CACHED = {
  ...MOCK_FINANCIALS,
  from_cache: true,
};

const APPLE_CIK = "320193";
const APPLE_TICKER = "AAPL";
const DETAIL_URL = `/company/${APPLE_CIK}?ticker=${APPLE_TICKER}`;
const API_URL = `/api/v1/edgar/company/${APPLE_CIK}/financials*`;

describe("US-04 — Company financial detail", () => {
  it("shows the market price section", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("Market Price").should("be.visible");
  });

  it("shows the stored price and last update date", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("$189.30").should("be.visible");
    cy.contains("Updated").should("be.visible");
  });

  it("shows not available message when ticker has no stored price", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS_NO_PRICE }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("not available").should("be.visible");
  });

  it("shows the EDGAR financial data section", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("Financial Data").should("be.visible");
  });

  it("shows all five financial metrics", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("Revenue").should("be.visible");
    cy.contains("Net Income").should("be.visible");
    cy.contains("EPS").should("be.visible");
    cy.contains("Total Assets").should("be.visible");
    cy.contains("Total Liabilities").should("be.visible");
  });

  it("shows the reporting period for each metric", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("2023-09-30").should("be.visible");
  });

  it("shows no XBRL data message when company has no financial data", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS_NO_XBRL }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("No XBRL financial data available").should("be.visible");
  });

  it("shows cached badge when data comes from cache", () => {
    cy.intercept("GET", API_URL, { statusCode: 200, body: MOCK_FINANCIALS_CACHED }).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@financials");

    cy.contains("cached").should("be.visible");
  });

  it("navigates to detail when clicking a result from search", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=Apple", {
      statusCode: 200,
      body: [{ name: "Apple Inc.", ticker: "AAPL", cik: 320193 }],
    }).as("search");
    cy.intercept("GET", `/api/v1/edgar/company/320193/financials*`, {
      statusCode: 200,
      body: MOCK_FINANCIALS,
    }).as("financials");

    cy.visit("/search");
    cy.get("input").type("Apple{enter}");
    cy.wait("@search");
    cy.contains("AAPL").click();

    cy.url().should("include", "/company/320193");
    cy.wait("@financials");
    cy.contains("Financial Data").should("be.visible");
  });
});