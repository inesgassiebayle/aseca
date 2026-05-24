const APPLE_COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };
const APPLE_CIK = "320193";
const APPLE_TICKER = "AAPL";
const DETAIL_URL = `/company/${APPLE_TICKER}`;
const FINANCIALS_URL = `/api/v1/edgar/company/${APPLE_CIK}/financials*`;

const MOCK_FINANCIALS = {
  cik: "320193", ticker: "AAPL", price: 189.3,
  price_last_updated: "2024-06-01T12:00:00",
  financials_available: true, from_cache: false,
  revenue: { concept: "Revenues", value: 383285000000, unit: "USD", period: "2023-09-30" },
  net_income: { concept: "NetIncomeLoss", value: 96995000000, unit: "USD", period: "2023-09-30" },
  eps: { concept: "EarningsPerShareBasic", value: 6.13, unit: "USD/shares", period: "2023-09-30" },
  total_assets: { concept: "Assets", value: 352583000000, unit: "USD", period: "2023-09-30" },
  total_liabilities: { concept: "Liabilities", value: 290437000000, unit: "USD", period: "2023-09-30" },
};
const MOCK_FINANCIALS_NO_PRICE = { ...MOCK_FINANCIALS, price: null, price_last_updated: null };
const MOCK_FINANCIALS_NO_XBRL = {
  ...MOCK_FINANCIALS, financials_available: false,
  revenue: null, net_income: null, eps: null, total_assets: null, total_liabilities: null,
};
const MOCK_FINANCIALS_CACHED = { ...MOCK_FINANCIALS, from_cache: true };

function interceptSearchDetail() {
  cy.intercept("GET", "/api/v1/edgar/search*", {
    statusCode: 200,
    body: [APPLE_COMPANY],
  }).as("searchCompany");
}

function interceptPriceDetail(price: number | null = 189.3) {
  cy.intercept("GET", `/api/v1/prices/${APPLE_TICKER}`, {
    statusCode: 200,
    body: { ticker: APPLE_TICKER, price },
  }).as("getPrice");
}

function interceptFinancials(body: object) {
  cy.intercept("GET", FINANCIALS_URL, {
    statusCode: 200,
    body,
  }).as("getFinancials");
}

describe("US-04 — Company financial detail", () => {
  it("shows the EDGAR financial data section", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    interceptFinancials(MOCK_FINANCIALS);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("Financial Data").should("be.visible");
  });

  it("shows all five financial metrics", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    interceptFinancials(MOCK_FINANCIALS);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("Revenue").should("be.visible");
    cy.contains("Net Income").should("be.visible");
    cy.contains("EPS").should("be.visible");
    cy.contains("Total Assets").should("be.visible");
    cy.contains("Total Liabilities").should("be.visible");
  });

  it("shows the reporting period for each metric", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    interceptFinancials(MOCK_FINANCIALS);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("2023-09-30").should("be.visible");
  });

  it("shows price not available when ticker not in whitelist", () => {
    interceptSearchDetail();
    interceptPriceDetail(null);
    interceptFinancials(MOCK_FINANCIALS_NO_PRICE);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("Price not available").should("be.visible");
  });

  it("shows no XBRL data message when company has no financial data", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    interceptFinancials(MOCK_FINANCIALS_NO_XBRL);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("No XBRL financial data available").should("be.visible");
  });

  it("shows cached badge when data comes from cache", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    interceptFinancials(MOCK_FINANCIALS_CACHED);
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.contains("button", "financials").click();
    cy.wait("@getFinancials");

    cy.contains("cached").should("be.visible");
  });

  it("does not call financials API before clicking the tab", () => {
    interceptSearchDetail();
    interceptPriceDetail();
    cy.intercept("GET", FINANCIALS_URL).as("financials");
    cy.visit(DETAIL_URL);
    cy.wait("@searchCompany");

    cy.wait(500);
    cy.get("@financials.all").should("have.length", 0);
  });

  it("navigates to detail when clicking a result from search", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=Apple", {
      statusCode: 200,
      body: [APPLE_COMPANY],
    }).as("search");
    cy.intercept("GET", "/api/v1/edgar/search?q=AAPL", {
      statusCode: 200,
      body: [APPLE_COMPANY],
    }).as("searchCompany");
    interceptPriceDetail();

    cy.visit("/search");
    cy.get("input").type("Apple{enter}");
    cy.wait("@search");
    cy.contains("AAPL").click();

    cy.url().should("include", "/company/AAPL");
    cy.wait("@searchCompany");
    cy.contains(APPLE_COMPANY.name).should("be.visible");
  });
});