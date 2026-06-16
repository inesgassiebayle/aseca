function login() {
    cy.visit("/login");
    cy.get('input[type="email"]').type("admin@gmail.com");
    cy.get('input[type="password"]').type("admin123");
    cy.get('button[type="submit"]').click();
    cy.url().should("not.include", "/login");
}

// US-11 — Ver portfolio
describe("US-11 — Ver portfolio", () => {
    beforeEach(() => {
        login();
        cy.visit("/portfolio");
    });

    it("muestra el título My holdings", () => {
        cy.get('[data-cy="portfolio-title"]').should("be.visible");
    });

    it("muestra el valor total del portfolio", () => {
        cy.get('[data-cy="total-portfolio-value-label"]').should("be.visible");
    });

    it("muestra posiciones o mensaje de portfolio vacío", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            const hasPositions = $body.find('[data-cy="position-row"]').length > 0;
            const hasEmpty = $body.find('[data-cy="empty-portfolio-message"]').length > 0;
            expect(hasPositions || hasEmpty).to.be.true;
        });
    });

    it("muestra la fecha de última actualización de precios si hay posiciones", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            if ($body.find('[data-cy="position-row"]').length > 0) {
                cy.get('[data-cy="updated-label"]').should("be.visible");
            }
        });
    });
});

// US-19/20 — P&L por posición y total
describe("US-19/20 — P&L", () => {
    beforeEach(() => {
        login();
        cy.visit("/portfolio");
    });

    it("muestra labels de P&L total del portfolio", () => {
        cy.get('[data-cy="total-portfolio-value-label"]').should("be.visible");
        cy.get('[data-cy="cost-basis-label"]').should("be.visible");
    });

    it("muestra P&L por posición si hay posiciones", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            if ($body.find('[data-cy="position-row"]').length > 0) {
                cy.get('[data-cy="position-pnl"]').first().should("be.visible");
            }
        });
    });
});

// US-08 — Comprar acciones
describe("US-08 — Comprar acciones", () => {
    beforeEach(() => {
        login();
        cy.visit("/portfolio");
    });

    it("muestra el botón New position", () => {
        cy.get('[data-cy="new-position-btn"]').should("be.visible");
    });

    it("abre el dialog de compra al hacer click en New position", () => {
        cy.get('[data-cy="new-position-btn"]').click();
        cy.get('[data-cy="buy-dialog-title"]').should("be.visible");
    });

    it("compra exitosa cierra el dialog y recarga el portfolio", () => {
        cy.get('[data-cy="new-position-btn"]').click();
        cy.get('[data-cy="buy-ticker-input"]').type("AAPL");
        cy.get('[data-cy="buy-quantity-input"]').type("1");
        cy.get('[data-cy="confirm-buy-btn"]').click();
        cy.get('[data-cy="buy-dialog-title"]', { timeout: 10000 }).should("not.exist");
    });

    it("muestra error si el ticker no tiene precio almacenado", () => {
        cy.get('[data-cy="new-position-btn"]').click();
        cy.get('[data-cy="buy-ticker-input"]').type("ZZZFAKE");
        cy.get('[data-cy="buy-quantity-input"]').type("1");
        cy.get('[data-cy="confirm-buy-btn"]').click();
        cy.get('[data-cy="buy-error"]', { timeout: 10000 }).should("be.visible");
    });
});

// US-09 — Vender acciones
describe("US-09 — Vender acciones", () => {
    beforeEach(() => {
        login();
        cy.visit("/portfolio");
    });

    it("navega al detalle de posición al hacer click en una fila si hay posiciones", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            if ($body.find('[data-cy="position-row"]').length > 0) {
                cy.get('[data-cy="position-row"]').first().click();
                cy.url().should("include", "/portfolio/");
            }
        });
    });
});

// US-10 — Ver historial de operaciones
describe("US-10 — Ver historial de operaciones", () => {
    beforeEach(() => {
        login();
        cy.visit("/operations");
    });

    it("muestra el título Transactions", () => {
        cy.get('[data-cy="transactions-title"]').should("be.visible");
    });

    it("muestra operaciones o mensaje de vacío", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            const hasOps = $body.find('[data-cy="operation-row"]').length > 0;
            const hasEmpty = $body.find('[data-cy="empty-operations-message"]').length > 0;
            expect(hasOps || hasEmpty).to.be.true;
        });
    });

    it("muestra el filtro por ticker", () => {
        cy.get('[data-cy="filter-ticker-input"]').should("be.visible");
    });

    it("muestra BUY y SELL si hay operaciones", () => {
        cy.get("body", { timeout: 10000 }).then(($body) => {
            if ($body.find('[data-cy="operation-row"]').length > 0) {
                cy.contains(/BUY|SELL/).should("be.visible");
            }
        });
    });
});

// US-12 — Ver detalle de posición
describe("US-12 — Ver detalle de posición", () => {
    beforeEach(() => {
        login();
        // Primero compramos AAPL para garantizar que existe la posición
        cy.visit("/portfolio");
        cy.get('[data-cy="new-position-btn"]').click();
        cy.get('[data-cy="buy-ticker-input"]').type("AAPL");
        cy.get('[data-cy="buy-quantity-input"]').type("1");
        cy.get('[data-cy="confirm-buy-btn"]').click();
        cy.get('[data-cy="buy-dialog-title"]', { timeout: 10000 }).should("not.exist");
        cy.visit("/portfolio/AAPL");
    });

    it("muestra el ticker AAPL", () => {
        cy.contains("AAPL", { timeout: 10000 }).should("be.visible");
    });

    it("muestra la cantidad de acciones", () => {
        cy.contains(/\d+ shares/, { timeout: 10000 }).should("be.visible");
    });

    it("muestra el precio promedio de compra", () => {
        cy.get('[data-cy="avg-price"]', { timeout: 10000 }).should("be.visible");
    });

    it("muestra el P&L de la posición", () => {
        cy.get('[data-cy="position-pnl"]', { timeout: 10000 }).should("be.visible");
    });

    it("muestra el historial de operaciones de la posición", () => {
        cy.get('[data-cy="operations-heading"]', { timeout: 10000 }).should("be.visible");
    });

    it("tiene un link para volver al portfolio", () => {
        cy.get('[data-cy="back-to-portfolio"]').should("be.visible");
    });
});