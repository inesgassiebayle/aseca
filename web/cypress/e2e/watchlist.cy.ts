const MOCK_WATCHLIST = [
    { id: 1, ticker: "AAPL", price: 189.5, updated_at: "2025-01-01T12:00:00" },
    { id: 2, ticker: "TSLA", price: null, updated_at: null },
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
            ? { id: 3, ticker, price: null, updated_at: null }
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
        interceptWatchlist([...MOCK_WATCHLIST, { id: 3, ticker: "MSFT", price: null, updated_at: null }]);

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
        interceptWatchlist([{ id: 2, ticker: "TSLA", price: null, updated_at: null }]);

        cy.get("[data-testid='watchlist-remove-AAPL']").click();

        cy.wait("@deleteWatchlist");
        cy.wait("@getWatchlist");
        cy.contains("AAPL").should("not.exist");
    });
});

// US-23 — Ver watchlist con precios actuales
describe("US-23 — Ver watchlist con precios actuales", () => {
    beforeEach(() => {
        cy.login();
        interceptWatchlist(MOCK_WATCHLIST);
        cy.visit("/watchlist");
        cy.wait("@getWatchlist");
    });

    it("muestra el precio cuando está disponible", () => {
        cy.get("[data-testid='watchlist-price-AAPL']")
            .should("be.visible")
            .and("contain", "189.50");
    });

    it("muestra N/A cuando no hay precio", () => {
        cy.get("[data-testid='watchlist-price-TSLA']")
            .should("be.visible")
            .and("contain", "N/A");
    });

    it("muestra la fecha de actualización cuando hay precio", () => {
        cy.get("[data-testid='watchlist-item-AAPL']")
            .find("[data-testid='watchlist-updated-at-AAPL']")
            .should("be.visible")
            .and("not.be.empty");
    });

    it("no muestra fecha cuando no hay precio", () => {
        cy.get("[data-testid='watchlist-updated-at-TSLA']")
            .should("contain", "—");
    });

    it("watchlist vacía sigue mostrando mensaje", () => {
        interceptWatchlist([]);
        cy.visit("/watchlist");
        cy.wait("@getWatchlist");
        cy.contains("Tu watchlist está vacía").should("be.visible");
    });
});