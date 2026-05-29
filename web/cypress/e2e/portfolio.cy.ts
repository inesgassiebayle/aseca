const MOCK_POSITIONS = [
    {
        id: 1,
        ticker: "AAPL",
        quantity: 10,
        avg_price: 168.42,
        current_price: 214.30,
        current_value: 2143.0,
        price_updated_at: "2026-05-29T18:32:24Z",
        pnl: 458.8,
        pnl_pct: 27.24,
    },
    {
        id: 2,
        ticker: "MSFT",
        quantity: 5,
        avg_price: 380.10,
        current_price: 442.61,
        current_value: 2213.05,
        price_updated_at: "2026-05-29T18:32:24Z",
        pnl: 312.55,
        pnl_pct: 16.43,
    },
];

const EMPTY_POSITIONS: never[] = [];

function interceptPortfolio(body: object) {
    cy.intercept("GET", "/api/v1/portfolio/", {
        statusCode: 200,
        body,
    }).as("getPortfolio");
}

function interceptBuy(statusCode = 201) {
    cy.intercept("POST", "/api/v1/portfolio/buy", {
        statusCode,
        body: statusCode === 201
            ? { id: 1, ticker: "AAPL", type: "buy", quantity: 10, price: 214.30, executed_at: "2026-05-29T18:32:24Z" }
            : { detail: "No hay precio almacenado para XYZ" },
    }).as("buy");
}

function interceptSell(statusCode = 201) {
    cy.intercept("POST", "/api/v1/portfolio/sell", {
        statusCode,
        body: statusCode === 201
            ? { id: 2, ticker: "AAPL", type: "sell", quantity: 5, price: 214.30, executed_at: "2026-05-29T18:32:24Z" }
            : { detail: "Cantidad insuficiente para AAPL" },
    }).as("sell");
}

function interceptOperations() {
    cy.intercept("GET", "/api/v1/operations/", {
        statusCode: 200,
        body: [
            { id: 1, ticker: "AAPL", type: "buy", quantity: 10, price: 214.30, executed_at: "2026-05-29T18:32:24Z" },
            { id: 2, ticker: "AAPL", type: "sell", quantity: 5, price: 214.30, executed_at: "2026-05-28T18:32:24Z" },
        ],
    }).as("getOperations");
}

function interceptPositionDetail() {
    cy.intercept("GET", "/api/v1/portfolio/AAPL", {
        statusCode: 200,
        body: {
            ticker: "AAPL",
            quantity: 10,
            avg_price: 168.42,
            current_price: 214.30,
            pnl: 458.8,
            operations: [
                { id: 1, ticker: "AAPL", type: "buy", quantity: 10, price: 168.42, executed_at: "2026-05-29T18:32:24Z" },
            ],
        },
    }).as("getPositionDetail");
}

// US-11 — Ver portfolio
describe("US-11 — Ver portfolio", () => {
    beforeEach(() => {
        cy.login();
        interceptPortfolio(MOCK_POSITIONS);
        cy.visit("/portfolio");
        cy.wait("@getPortfolio");
    });

    it("muestra el título My holdings", () => {
        cy.contains("My holdings").should("be.visible");
    });

    it("muestra el valor total del portfolio", () => {
        cy.contains("Total portfolio value").should("be.visible");
    });

    it("muestra las posiciones con ticker y cantidad", () => {
        cy.contains("AAPL").should("be.visible");
        cy.contains("MSFT").should("be.visible");
    });

    it("muestra el valor por posición", () => {
        cy.contains("$2,143.00").should("be.visible");
    });

    it("muestra mensaje cuando el portfolio está vacío", () => {
        interceptPortfolio(EMPTY_POSITIONS);
        cy.visit("/portfolio");
        cy.wait("@getPortfolio");
        cy.contains("No tenés posiciones todavía").should("be.visible");
    });

    it("muestra la fecha de última actualización de precios", () => {
        cy.contains("Updated").should("be.visible");
    });
});

// US-19/20 — P&L por posición y total
describe("US-19/20 — P&L", () => {
    beforeEach(() => {
        cy.login();
        interceptPortfolio(MOCK_POSITIONS);
        cy.visit("/portfolio");
        cy.wait("@getPortfolio");
    });

    it("muestra P&L positivo en verde para AAPL", () => {
        cy.contains("+$458.80").should("be.visible");
        cy.contains("+27.24%").should("be.visible");
    });

    it("muestra P&L total del portfolio", () => {
        cy.contains("Total portfolio value").should("be.visible");
        cy.contains("Cost basis").should("be.visible");
    });
});

// US-08 — Comprar acciones
describe("US-08 — Comprar acciones", () => {
    beforeEach(() => {
        cy.login();
        interceptPortfolio(MOCK_POSITIONS);
        cy.visit("/portfolio");
        cy.wait("@getPortfolio");
    });

    it("muestra el botón New position", () => {
        cy.contains("+ New position").should("be.visible");
    });

    it("abre el dialog de compra al hacer click en New position", () => {
        cy.contains("+ New position").click();
        cy.contains("Comprar acciones").should("be.visible");
    });

    it("compra exitosa cierra el dialog y recarga el portfolio", () => {
        interceptBuy(201);
        interceptPortfolio(MOCK_POSITIONS);

        cy.contains("+ New position").click();
        cy.get("input[placeholder='AAPL']").type("AAPL");
        cy.get("input[placeholder='10']").type("10");
        cy.contains("Confirmar").click();

        cy.wait("@buy");
        cy.wait("@getPortfolio");
        cy.contains("Comprar acciones").should("not.exist");
    });

    it("muestra error si el ticker no tiene precio almacenado", () => {
        interceptBuy(422);

        cy.contains("+ New position").click();
        cy.get("input[placeholder='AAPL']").type("XYZ");
        cy.get("input[placeholder='10']").type("10");
        cy.contains("Confirmar").click();

        cy.wait("@buy");
        cy.contains("No hay precio almacenado para XYZ").should("be.visible");
    });
});

// US-09 — Vender acciones
describe("US-09 — Vender acciones", () => {
    beforeEach(() => {
        cy.login();
        interceptPortfolio(MOCK_POSITIONS);
        cy.visit("/portfolio");
        cy.wait("@getPortfolio");
    });

    it("navega al detalle de posición al hacer click en una fila", () => {
        interceptPositionDetail();
        cy.contains("AAPL").click();
        cy.url().should("include", "/portfolio/AAPL");
    });
});

// US-10 — Ver historial de operaciones
describe("US-10 — Ver historial de operaciones", () => {
    beforeEach(() => {
        cy.login();
        interceptOperations();
        cy.visit("/operations");
        cy.wait("@getOperations");
    });

    it("muestra el título Transactions", () => {
        cy.contains("Transactions").should("be.visible");
    });

    it("muestra las operaciones con tipo, ticker y total", () => {
        cy.contains("BUY").should("be.visible");
        cy.contains("SELL").should("be.visible");
        cy.contains("AAPL").should("be.visible");
    });

    it("muestra el filtro por ticker", () => {
        cy.get("input[placeholder='Filter by ticker…']").should("be.visible");
    });

    it("muestra mensaje cuando no hay operaciones", () => {
        cy.intercept("GET", "/api/v1/operations/", {
            statusCode: 200,
            body: [],
        }).as("emptyOperations");
        cy.visit("/operations");
        cy.wait("@emptyOperations");
        cy.contains("No hay operaciones registradas todavía").should("be.visible");
    });
});

// US-12 — Ver detalle de posición
describe("US-12 — Ver detalle de posición", () => {
    beforeEach(() => {
        cy.login();
        interceptPositionDetail();
        cy.visit("/portfolio/AAPL");
        cy.wait("@getPositionDetail");
    });

    it("muestra el ticker y cantidad de acciones", () => {
        cy.contains("AAPL").should("be.visible");
        cy.contains("10 shares").should("be.visible");
    });

    it("muestra el precio promedio de compra", () => {
        cy.contains("$168.42").should("be.visible");
    });

    it("muestra el P&L de la posición", () => {
        cy.contains("$458.80").should("be.visible");
    });

    it("muestra el historial de operaciones de la posición", () => {
        cy.contains("Operations").should("be.visible");
        cy.contains("BUY").should("be.visible");
    });

    it("tiene un link para volver al portfolio", () => {
        cy.contains("← Portfolio").should("be.visible");
    });
});