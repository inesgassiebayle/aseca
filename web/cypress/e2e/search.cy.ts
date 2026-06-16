describe("Search page", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit("/search");
    });

    it("renders the header and search input", () => {
        cy.get('[data-cy="search-title"]').should("be.visible");
        cy.get('[data-cy="search-input"]')
            .should("be.visible")
            .and("have.attr", "placeholder", "Search by ticker or company name…");
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

    it("fetches on Enter y muestra resultados reales", () => {
        cy.get('[data-cy="search-input"]').type("Apple{enter}");
        cy.contains("Apple", { timeout: 15000 }).should("be.visible");
        cy.contains("AAPL").should("be.visible");
    });

    it("muestra el badge con la cantidad de resultados", () => {
        cy.get('[data-cy="search-input"]').type("Apple{enter}");
        cy.contains("AAPL", { timeout: 15000 }).should("be.visible");
        cy.get('[data-cy="result-count"]').should("be.visible");
    });

    it("muestra empty state cuando no hay resultados", () => {
        cy.get('[data-cy="search-input"]').type("xyznotfound{enter}");
        cy.get('[data-cy="no-results-message"]', { timeout: 15000 }).should("be.visible");
    });

    it("busca por ticker exacto", () => {
        cy.get('[data-cy="search-input"]').type("MSFT{enter}");
        cy.contains("MSFT", { timeout: 15000 }).should("be.visible");
    });

    it("does not fetch when submitting an empty input", () => {
        cy.intercept("GET", "/api/v1/edgar/search*").as("search");
        cy.get('[data-cy="search-input"]').type("{enter}");
        cy.wait(300);
        cy.get("@search.all").should("have.length", 0);
    });
});