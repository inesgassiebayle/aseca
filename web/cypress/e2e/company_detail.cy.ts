const APPLE_COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };
const APPLE_CIK = "320193";
const APPLE_TICKER = "AAPL";
const DETAIL_URL = `/company/${APPLE_TICKER}`;

describe("US-04 — Company financial detail", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit(DETAIL_URL);
        cy.contains(APPLE_COMPANY.name, { timeout: 15000 });
    });

    it("shows the EDGAR financial data section", () => {
        cy.get('[data-cy="tab-financials"]').click();
        cy.get('[data-cy="financial-data-title"]', { timeout: 15000 }).should("be.visible");
    });

    it("shows all five financial metrics", () => {
        cy.get('[data-cy="tab-financials"]').click();
        cy.get('[data-cy="financial-data-title"]', { timeout: 15000 });
        cy.contains("Revenue").should("be.visible");
        cy.contains("Net Income").should("be.visible");
        cy.contains("EPS").should("be.visible");
        cy.contains("Total Assets").should("be.visible");
        cy.contains("Total Liabilities").should("be.visible");
    });

    it("shows the reporting period for each metric", () => {
        cy.get('[data-cy="tab-financials"]').click();
        cy.get('[data-cy="financial-data-title"]', { timeout: 15000 });
        cy.get('[data-cy="metric-period"]').first().should("be.visible");
    });

    it("shows price or price-not-available indicator", () => {
        cy.get("body").then(($body) => {
            const hasPrice = $body.text().match(/\$\d+\.\d{2}/);
            const hasNoPriceMsg = $body.find('[data-cy="price-not-available"]').length > 0;
            expect(!!hasPrice || hasNoPriceMsg).to.be.true;
        });
    });

    it("shows financial data or no-xbrl message", () => {
        cy.get('[data-cy="tab-financials"]').click();
        cy.get("body", { timeout: 15000 }).then(($body) => {
            const hasData = $body.find('[data-cy="financial-data-title"]').length > 0;
            const hasNoXbrl = $body.find('[data-cy="no-xbrl-message"]').length > 0;
            expect(hasData || hasNoXbrl).to.be.true;
        });
    });

    it("does not call financials API before clicking the tab", () => {
        cy.intercept("GET", `/api/v1/edgar/company/${APPLE_CIK}/financials*`).as("financials");
        cy.wait(500);
        cy.get("@financials.all").should("have.length", 0);
    });

    it("navigates to detail when clicking a result from search", () => {
        cy.visit("/search");
        cy.get('[data-cy="search-input"]').type("Apple{enter}");
        cy.contains("AAPL", { timeout: 15000 }).click();
        cy.url().should("include", "/company/AAPL");
        cy.contains(APPLE_COMPANY.name, { timeout: 15000 }).should("be.visible");
    });
});