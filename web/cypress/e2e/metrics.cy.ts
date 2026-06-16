export {};

const COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };

function login() {
    cy.visit("/login");
    cy.get('input[type="email"]').type("admin@gmail.com");
    cy.get('input[type="password"]').type("admin123");
    cy.get('button[type="submit"]').click();
    cy.url().should("not.include", "/login");
}

function visitAndOpenMetrics() {
    cy.visit(`/company/${COMPANY.ticker}`);
    cy.contains(COMPANY.name, { timeout: 15000 });
    cy.get('[data-cy="tab-metrics"]').click();
}

describe("Company page - tab Metrics", () => {
    beforeEach(() => {
        login();
    });

    it("shows the metrics tab button", () => {
        cy.visit(`/company/${COMPANY.ticker}`);
        cy.contains(COMPANY.name, { timeout: 15000 });
        cy.get('[data-cy="tab-metrics"]').should("be.visible");
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
        login();
        visitAndOpenMetrics();
        cy.get('[data-cy="metric-btn-revenue"]', { timeout: 15000 });
    });

    it("shows column headers", () => {
        cy.contains("Period end").should("be.visible");
        cy.contains("Value").should("be.visible");
        cy.contains("Form").should("be.visible");
        cy.contains("Filed").should("be.visible");
    });

    it("shows data rows or empty state", () => {
        cy.get("body", { timeout: 15000 }).then(($body) => {
            const hasData = $body.find('[data-cy="metric-row"]').length > 0;
            const hasEmpty = $body.find('[data-cy="no-metrics-message"]').length > 0;
            expect(hasData || hasEmpty).to.be.true;
        });
    });

    it("shows form badges si hay datos", () => {
        cy.get("body", { timeout: 15000 }).then(($body) => {
            if ($body.find('[data-cy="metric-row"]').length > 0) {
                cy.contains(/10-K|10-Q/).should("be.visible");
            }
        });
    });
});

describe("Company page - Metrics switching", () => {
    beforeEach(() => {
        login();
        visitAndOpenMetrics();
        cy.get('[data-cy="metric-btn-revenue"]', { timeout: 15000 });
    });

    it("clicking Net Income muestra datos o empty state", () => {
        cy.contains("Net Income").click();
        cy.get("body", { timeout: 15000 }).then(($body) => {
            const hasData = $body.find('[data-cy="metric-row"]').length > 0;
            const hasEmpty = $body.find('[data-cy="no-metrics-message"]').length > 0;
            expect(hasData || hasEmpty).to.be.true;
        });
    });

    it("clicking EPS muestra datos o empty state", () => {
        cy.contains("EPS").click();
        cy.get("body", { timeout: 15000 }).then(($body) => {
            const hasData = $body.find('[data-cy="metric-row"]').length > 0;
            const hasEmpty = $body.find('[data-cy="no-metrics-message"]').length > 0;
            expect(hasData || hasEmpty).to.be.true;
        });
    });

    it("switching entre métricas mantiene los headers visibles", () => {
        cy.contains("Net Income").click();
        cy.contains("Period end", { timeout: 15000 }).should("be.visible");
        cy.contains("EPS").click();
        cy.contains("Period end", { timeout: 15000 }).should("be.visible");
    });
});

describe("Company page - Metrics isolation", () => {
    beforeEach(() => {
        login();
    });

    it("opening filings tab no muestra contenido de metrics", () => {
        cy.visit(`/company/${COMPANY.ticker}`);
        cy.contains(COMPANY.name, { timeout: 15000 });
        cy.get('[data-cy="tab-filings"]').click();
        cy.get('[data-cy="metric-btn-revenue"]').should("not.exist");
    });
});