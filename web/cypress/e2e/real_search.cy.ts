// Real E2E — search and company detail hitting the actual backend (no cy.intercept)
// These tests hit the real EDGAR API through the backend.

describe("[E2E] Search — backend real", () => {
    it("buscar 'Apple' devuelve resultados reales de EDGAR", () => {
        cy.visit("/search");
        cy.get('[data-cy="search-title"]').should("be.visible");
        cy.get('[data-cy="search-input"]').type("Apple{enter}");

        // Real EDGAR results — AAPL should always be in there
        cy.contains("AAPL", { timeout: 10000 }).should("be.visible");
        cy.contains("Apple Inc.").should("be.visible");
    });

    it("navegar al detalle de empresa desde resultados de búsqueda", () => {
        cy.visit("/search?q=AAPL");

        cy.contains("AAPL", { timeout: 10000 }).click();

        cy.url().should("include", "/company/AAPL");
        cy.contains("Apple Inc.", { timeout: 10000 }).should("be.visible");
    });

    it("búsqueda sin resultados muestra empty state", () => {
        cy.visit("/search");
        cy.get('[data-cy="search-input"]').type("XYZNOTAREALCOMPANY999{enter}");

        cy.get('[data-cy="no-results-message"]', { timeout: 10000 }).should("be.visible");
    });
});

describe("[E2E] Company page — backend real", () => {
    it("página de AAPL muestra nombre, ticker y precio real", () => {
        cy.visit("/company/AAPL");

        cy.contains("Apple Inc.", { timeout: 10000 }).should("be.visible");
        cy.contains("AAPL").should("be.visible");
        // Price loaded from real backend (batch was run)
        cy.contains("$", { timeout: 8000 }).should("be.visible");
    });

    it("tab overview activo por defecto", () => {
        cy.visit("/company/AAPL");
        cy.wait(2000); // let page load company data
        cy.get('[data-cy="tab-overview"]', { timeout: 8000 }).should("have.attr", "data-active", "true");
    });

    it("tab financials carga datos reales de EDGAR", () => {
        cy.visit("/company/AAPL");
        cy.get('[data-cy="tab-financials"]', { timeout: 8000 }).click();

        cy.get('[data-cy="financial-data-title"]', { timeout: 15000 }).should("be.visible");
        // At least one metric should be present
        cy.contains("Revenue").should("be.visible");
    });

    it("ticker inexistente muestra back-to-search", () => {
        cy.visit("/company/XYZFAKE999");

        cy.get('[data-cy="back-to-search"]', { timeout: 8000 }).should("be.visible");
    });
});
