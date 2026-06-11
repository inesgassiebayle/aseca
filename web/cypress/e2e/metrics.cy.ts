export {};

const COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };

const REVENUE_DATA = {
  cik: 320193,
  metric: "revenue",
  cached: false,
  data_points: [
    { period_end: "2024-09-30", value: 94930000000, form: "10-K", filed: "2024-11-01" },
    { period_end: "2024-06-30", value: 85777000000, form: "10-Q", filed: "2024-08-02" },
    { period_end: "2024-03-31", value: 90753000000, form: "10-Q", filed: "2024-05-03" },
    { period_end: "2023-12-31", value: 119575000000, form: "10-Q", filed: "2024-02-02" },
  ],
};

const NET_INCOME_DATA = {
  cik: 320193,
  metric: "net_income",
  cached: true,
  data_points: [
    { period_end: "2024-09-30", value: 14736000000, form: "10-K", filed: "2024-11-01" },
    { period_end: "2024-06-30", value: 21448000000, form: "10-Q", filed: "2024-08-02" },
  ],
};

const EPS_DATA = {
  cik: 320193,
  metric: "eps",
  cached: false,
  data_points: [
    { period_end: "2024-09-30", value: 0.97, form: "10-K", filed: "2024-11-01" },
    { period_end: "2024-06-30", value: 1.40, form: "10-Q", filed: "2024-08-02" },
  ],
};

const EMPTY_DATA = {
  cik: 320193,
  metric: "revenue",
  cached: false,
  data_points: [],
};

function interceptCompany() {
  cy.intercept("GET", "/api/v1/edgar/search?q=AAPL", {
    statusCode: 200,
    body: [COMPANY],
  }).as("searchCompany");
}

function interceptPrice() {
  cy.intercept("GET", `/api/v1/prices/${COMPANY.ticker}`, {
    statusCode: 200,
    body: { ticker: COMPANY.ticker, price: 175.5 },
  }).as("getPrice");
}

function interceptMetric(metric: string, body: object) {
  cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/metrics/${metric}`, {
    statusCode: 200,
    body,
  }).as(`getMetric_${metric}`);
}

function visitAndOpenMetrics() {
  cy.visit(`/company/${COMPANY.ticker}`);
  cy.wait("@searchCompany");
  cy.get('[data-cy="tab-metrics"]').click();
}


describe("Company page - tab Metrics", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice();
    interceptMetric("revenue", REVENUE_DATA);
  });

  it("shows the metrics tab button", () => {
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.get('[data-cy="tab-metrics"]').should("be.visible");
  });

  it("does not call metrics endpoint before opening the tab", () => {
    cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/metrics/**`).as("metrics");
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.wait(400);
    cy.get("@metrics.all").should("have.length", 0);
  });

  it("calls revenue endpoint when opening metrics tab", () => {
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue")
      .its("request.url")
      .should("include", `/companies/${COMPANY.cik}/metrics/revenue`);
  });

  it("shows the three metric selector buttons", () => {
    visitAndOpenMetrics();
    cy.contains("Revenue").should("be.visible");
    cy.contains("Net Income").should("be.visible");
    cy.contains("EPS").should("be.visible");
  });

  it("Revenue button is visible by default", () => {
    visitAndOpenMetrics();
    cy.get('[data-cy="metric-btn-revenue"]').should("be.visible");
  });
});

describe("Company page - Metrics data table", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice();
    interceptMetric("revenue", REVENUE_DATA);
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
  });

  it("shows column headers", () => {
    cy.contains("Period end").should("be.visible");
    cy.contains("Value").should("be.visible");
    cy.contains("Form").should("be.visible");
    cy.contains("Filed").should("be.visible");
  });

  it("shows period_end values", () => {
    cy.contains("2024-09-30").should("be.visible");
    cy.contains("2024-06-30").should("be.visible");
  });

  it("shows values formatted in billions", () => {
    cy.contains("$94.93B").should("be.visible");
    cy.contains("$85.78B").should("be.visible");
  });

  it("shows form badges (10-K and 10-Q)", () => {
    cy.contains("10-K").should("be.visible");
    cy.contains("10-Q").should("be.visible");
  });

  it("shows filed date", () => {
    cy.contains("2024-11-01").should("be.visible");
  });

  it("does not show cached badge when cached is false", () => {
    cy.get('[data-cy="cached-badge"]').should("not.exist");
  });
});

describe("Company page - Metrics switching", () => {
  beforeEach(() => {
    interceptCompany();
    interceptPrice();
    interceptMetric("revenue", REVENUE_DATA);
    interceptMetric("net_income", NET_INCOME_DATA);
    interceptMetric("eps", EPS_DATA);
  });

  it("clicking Net Income calls the correct endpoint", () => {
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
    cy.contains("Net Income").click();
    cy.wait("@getMetric_net_income")
      .its("request.url")
      .should("include", "metrics/net_income");
  });

  it("clicking EPS calls the correct endpoint", () => {
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
    cy.contains("EPS").click();
    cy.wait("@getMetric_eps")
      .its("request.url")
      .should("include", "metrics/eps");
  });

  it("EPS shows values with $ and two decimals", () => {
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
    cy.contains("EPS").click();
    cy.wait("@getMetric_eps");
    cy.contains("$0.97").should("be.visible");
    cy.contains("$1.40").should("be.visible");
  });

  it("shows cached badge when cached is true", () => {
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
    cy.contains("Net Income").click();
    cy.wait("@getMetric_net_income");
    cy.get('[data-cy="cached-badge"]')
      .should("be.visible")
      .and("contain", "Cached");
  });
});

describe("Company page - Metrics empty state", () => {
  it("shows informative message when data_points is empty", () => {
    interceptCompany();
    interceptPrice();
    interceptMetric("revenue", EMPTY_DATA);
    visitAndOpenMetrics();
    cy.wait("@getMetric_revenue");
    cy.get('[data-cy="no-metrics-message"]').should("be.visible");
  });
});

describe("Company page - Metrics isolation", () => {
  it("opening filings tab does not trigger metrics endpoint", () => {
    interceptCompany();
    interceptPrice();
    cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/filings`, {
      statusCode: 200,
      body: { filings: [], message: null },
    }).as("getFilings");
    cy.intercept("GET", `/api/v1/edgar/companies/${COMPANY.cik}/metrics/**`).as("metrics");

    cy.visit(`/company/${COMPANY.ticker}`);
    cy.wait("@searchCompany");
    cy.get('[data-cy="tab-filings"]').click();
    cy.wait("@getFilings");
    cy.wait(400);

    cy.get("@metrics.all").should("have.length", 0);
  });
});
