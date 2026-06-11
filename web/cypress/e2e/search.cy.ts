const MOCK_RESULTS = [
  { name: "Apple Inc.", ticker: "AAPL", cik: 320193 },
  { name: "Apple Hospitality REIT, Inc.", ticker: "APLE", cik: 1418121 },
];

describe("Search page", () => {
  beforeEach(() => {
    cy.visit("/search");
  });

  it("renders the header and search input", () => {
    cy.get('[data-cy="search-title"]').should("be.visible");
    cy.get('[data-cy="search-input"]').should("be.visible").and("have.attr", "placeholder", "Search by ticker or company name…");
  });

  it("shows the StockWatch logo linking to home", () => {
    cy.get('[data-cy="logo"]').should("be.visible");
    cy.get('[data-cy="logo"]').should("have.attr", "href", "/");
  });

  it("does not fetch the API before pressing Enter", () => {
    cy.intercept("GET", "/api/v1/edgar/search*").as("search");

    cy.get('[data-cy="search-input"]').type("apple");

    cy.wait(500);
    cy.get("@search.all").should("have.length", 0);
  });

  it("fetches on Enter and shows results", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=apple", {
      statusCode: 200,
      body: MOCK_RESULTS,
    }).as("search");

    cy.get('[data-cy="search-input"]').type("apple{enter}");

    cy.wait("@search");
    cy.contains("Apple Inc.").should("be.visible");
    cy.contains("AAPL").should("be.visible");
    cy.contains("CIK 320193").should("be.visible");
  });

  it("shows result count badge", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=apple", {
      statusCode: 200,
      body: MOCK_RESULTS,
    }).as("search");

    cy.get('[data-cy="search-input"]').type("apple{enter}");

    cy.wait("@search");
    cy.contains(`${MOCK_RESULTS.length}`).should("be.visible");
  });

  it("shows empty state when no results", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=xyznotfound", {
      statusCode: 200,
      body: [],
    }).as("search");

    cy.get('[data-cy="search-input"]').type("xyznotfound{enter}");

    cy.wait("@search");
    cy.get('[data-cy="no-results-message"]').should("be.visible");
  });

  it("sends the exact query typed by the user", () => {
    cy.intercept("GET", "/api/v1/edgar/search?q=MSFT", {
      statusCode: 200,
      body: [{ name: "MICROSOFT CORP", ticker: "MSFT", cik: 789019 }],
    }).as("search");

    cy.get('[data-cy="search-input"]').type("MSFT{enter}");

    cy.wait("@search").its("request.url").should("include", "q=MSFT");
  });

  it("does not fetch when submitting an empty input", () => {
    cy.intercept("GET", "/api/v1/edgar/search*").as("search");

    cy.get('[data-cy="search-input"]').type("{enter}");

    cy.wait(300);
    cy.get("@search.all").should("have.length", 0);
  });
});
