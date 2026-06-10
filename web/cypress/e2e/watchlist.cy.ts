const MOCK_WATCHLIST = [
    { id: 1, ticker: "AAPL" },
    { id: 2, ticker: "TSLA" },
];

const EMPTY_WATCHLIST: never[] = [];

function interceptWatchlist(body: object) {
    cy.intercept("GET", "/api/v1/watchlist/", {
        statusCode: 200,
        body,
    }).as("getWatchlist");
}

function interceptAdd(statusCode = 201, ticker = "MSFT") {
    cy.intercept("POST", "/api/v1/watchlist/", {
        statusCode,
        body: statusCode === 201
            ? { id: 3, ticker }
            : { detail: statusCode === 409 ? `${ticker} ya está en la watchlist` : `${ticker} no pertenece a la lista blanca` },
    }).as("addWatchlist");
}

// US-21 — Agregar empresa a la watchlist
describe("US-21 — Agregar empresa a la watchlist", () => {
    beforeEach(() => {
        cy.login();
        interceptWatchlist(MOCK_WATCHLIST);
        cy.visit("/watchlist");
        cy.wait("@getWatchlist");
    });

    it("muestra el título My watchlist", () => {
        cy.contains("My watchlist").should("be.visible");
    });

    it("muestra los tickers en la watchlist", () => {
        cy.contains("AAPL").should("be.visible");
        cy.contains("TSLA").should("be.visible");
    });

    it("muestra el input para agregar ticker", () => {
        cy.get("[data-testid='watchlist-input']").should("be.visible");
    });

    it("muestra mensaje cuando la watchlist está vacía", () => {
        interceptWatchlist(EMPTY_WATCHLIST);
        cy.visit("/watchlist");
        cy.wait("@getWatchlist");
        cy.contains("Tu watchlist está vacía").should("be.visible");
    });

    it("agrega un ticker nuevo exitosamente", () => {
        interceptAdd(201, "MSFT");
        interceptWatchlist([...MOCK_WATCHLIST, { id: 3, ticker: "MSFT" }]);

        cy.get("[data-testid='watchlist-input']").type("MSFT");
        cy.get("[data-testid='watchlist-add-btn']").click();

        cy.wait("@addWatchlist");
        cy.wait("@getWatchlist");
        cy.contains("MSFT").should("be.visible");
    });

    it("muestra error si el ticker ya está en la watchlist", () => {
        interceptAdd(409, "AAPL");

        cy.get("[data-testid='watchlist-input']").type("AAPL");
        cy.get("[data-testid='watchlist-add-btn']").click();

        cy.wait("@addWatchlist");
        cy.get("[data-testid='watchlist-error']")
            .should("be.visible")
            .and("contain", "watchlist");
    });

    it("muestra error si el ticker no está en la lista blanca", () => {
        interceptAdd(422, "CLARA");

        cy.get("[data-testid='watchlist-input']").type("CLARA");
        cy.get("[data-testid='watchlist-add-btn']").click();

        cy.wait("@addWatchlist");
        cy.get("[data-testid='watchlist-error']").should("be.visible");
    });

    it("el ticker se envía en mayúsculas", () => {
        interceptAdd(201, "MSFT");
        interceptWatchlist(MOCK_WATCHLIST);

        cy.get("[data-testid='watchlist-input']").type("msft");
        cy.get("[data-testid='watchlist-add-btn']").click();

        cy.wait("@addWatchlist").its("request.body.ticker").should("eq", "MSFT");
    });
});

// US-22 — Eliminar empresa de la watchlist
describe("US-22 — Eliminar empresa de la watchlist", () => {
    beforeEach(() => {
        cy.login();
        interceptWatchlist(MOCK_WATCHLIST);
        cy.visit("/watchlist");
        cy.wait("@getWatchlist");
    });

    it("muestra botón de eliminar en cada item", () => {
        cy.get("[data-testid='watchlist-item-AAPL']")
            .find("[data-testid='watchlist-remove-AAPL']")
            .should("be.visible");
    });

    it("elimina ticker exitosamente", () => {
        cy.intercept("DELETE", "/api/v1/watchlist/AAPL", {
            statusCode: 200,
            body: { message: "AAPL eliminado de tu watchlist" },
        }).as("deleteWatchlist");
        interceptWatchlist([{ id: 2, ticker: "TSLA" }]);

        cy.get("[data-testid='watchlist-remove-AAPL']").click();

        cy.wait("@deleteWatchlist");
        cy.wait("@getWatchlist");
        cy.contains("AAPL").should("not.exist");
    });
});