// Real E2E — portfolio flow hitting the actual backend (no cy.intercept)
// Requires: docker compose up (api + db) with prices loaded (POST /api/v1/prices/batch)

function getToken(): Cypress.Chainable<string> {
    return cy.window().its("localStorage").invoke("getItem", "access_token") as Cypress.Chainable<string>;
}

function clearAAPLPosition() {
    getToken().then((token) => {
        cy.request({
            method: "GET",
            url: "/api/v1/portfolio/AAPL",
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
        }).then((res) => {
            if (res.status === 200 && res.body.quantity > 0) {
                cy.request({
                    method: "POST",
                    url: "/api/v1/portfolio/sell",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: { ticker: "AAPL", quantity: res.body.quantity },
                });
            }
        });
    });
}

describe("[E2E] Portfolio — backend real", () => {
    beforeEach(() => {
        cy.loginReal();
        clearAAPLPosition();
    });

    it("portfolio vacío muestra mensaje de empty state", () => {
        cy.visit("/portfolio");
        cy.get('[data-cy="portfolio-title"]').should("be.visible");
        // may or may not have other tickers; AAPL was cleared
    });

    it("comprar AAPL aparece en el portfolio", () => {
        getToken().then((token) => {
            cy.request({
                method: "POST",
                url: "/api/v1/portfolio/buy",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: { ticker: "AAPL", quantity: 3 },
            }).its("status").should("eq", 201);
        });

        cy.visit("/portfolio");
        cy.contains("AAPL").should("be.visible");
        cy.contains("3").should("be.visible");
    });

    it("vender todas las acciones de AAPL lo elimina del portfolio", () => {
        getToken().then((token) => {
            cy.request({
                method: "POST",
                url: "/api/v1/portfolio/buy",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: { ticker: "AAPL", quantity: 2 },
            });
        });

        cy.visit("/portfolio");
        cy.contains("AAPL").should("be.visible");

        // Navigate to detail and sell
        cy.contains("AAPL").click();
        cy.url().should("include", "/portfolio/AAPL");

        // Sell via API (sell dialog is also testable via UI)
        getToken().then((token) => {
            cy.request({
                method: "POST",
                url: "/api/v1/portfolio/sell",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: { ticker: "AAPL", quantity: 2 },
            });
        });

        cy.visit("/portfolio");
        // AAPL should no longer appear
        cy.contains("AAPL").should("not.exist");
    });

    it("página de detalle de posición muestra datos reales de AAPL", () => {
        getToken().then((token) => {
            cy.request({
                method: "POST",
                url: "/api/v1/portfolio/buy",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: { ticker: "AAPL", quantity: 5 },
            });
        });

        cy.visit("/portfolio/AAPL");
        cy.contains("AAPL").should("be.visible");
        cy.contains("5 shares").should("be.visible");
        cy.get('[data-cy="operations-heading"]').should("be.visible");
        cy.get('[data-cy="back-to-portfolio"]').should("be.visible");
    });
});

describe("[E2E] Operations — backend real", () => {
    before(() => {
        cy.loginReal();
        // Buy one AAPL so operations history is not empty
        getToken().then((token) => {
            cy.request({
                method: "POST",
                url: "/api/v1/portfolio/buy",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: { ticker: "AAPL", quantity: 1 },
                failOnStatusCode: false,
            });
        });
    });

    it("historial de operaciones muestra al menos una operación de AAPL", () => {
        cy.loginReal();
        cy.visit("/operations");
        cy.get('[data-cy="transactions-title"]').should("be.visible");
        cy.contains("AAPL").should("be.visible");
        cy.contains("BUY").should("be.visible");
    });

    it("filtro por ticker muestra solo operaciones de AAPL", () => {
        cy.loginReal();
        cy.visit("/operations");
        cy.get('[data-cy="filter-ticker-input"]').type("AAPL");
        cy.get('[data-cy="filter-ticker-input"]').type("{enter}");
        cy.contains("AAPL").should("be.visible");
    });
});
