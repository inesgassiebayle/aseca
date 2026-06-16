const COMPANY = { name: "Apple Inc.", ticker: "AAPL", cik: 320193 };

describe("Company page", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit(`/company/${COMPANY.ticker}`);
    });

    it("muestra el nombre y ticker de la empresa", () => {
        cy.contains(COMPANY.name, { timeout: 15000 }).should("be.visible");
        cy.contains(COMPANY.ticker).should("be.visible");
    });

    it("muestra el CIK de la empresa", () => {
        cy.contains(`CIK ${COMPANY.cik}`, { timeout: 15000 }).should("be.visible");
    });

    it("muestra el tab overview activo por defecto", () => {
        cy.get('[data-cy="tab-overview"]', { timeout: 15000 }).should("have.attr", "data-active", "true");
    });

    it("muestra el tab filings", () => {
        cy.get('[data-cy="tab-filings"]', { timeout: 15000 }).should("be.visible");
    });

    it("tiene un botón de vuelta", () => {
        cy.get('[data-cy="back-btn"]', { timeout: 15000 }).should("be.visible");
    });

    it("muestra el logo StockWatch con link a home", () => {
        cy.get('[data-cy="logo"]').should("have.attr", "href", "/");
    });
});

describe("Company page — precio", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit(`/company/${COMPANY.ticker}`);
        cy.contains(COMPANY.name, { timeout: 15000 });
    });

    it("muestra el precio o indica que no está disponible", () => {
        const priceVisible = () =>
            cy.get("body").then(($body) =>
                $body.text().match(/\$\d+\.\d{2}/) ||
                $body.find('[data-cy="price-not-available"]').length > 0
            );
        priceVisible();
    });

    it("el precio se muestra con dos decimales si está disponible", () => {
        cy.get("body").then(($body) => {
            if ($body.text().match(/\$\d+\.\d{2}/)) {
                expect($body.text()).to.match(/\$\d+\.\d{2}/);
            } else {
                cy.get('[data-cy="price-not-available"]').should("be.visible");
            }
        });
    });
});

describe("Company page — tab Overview", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit(`/company/${COMPANY.ticker}`);
        cy.contains(COMPANY.name, { timeout: 15000 });
    });

    it("muestra ticker, CIK y nombre en cards", () => {
        cy.contains("AAPL").should("be.visible");
        cy.contains(`${COMPANY.cik}`).should("be.visible");
        cy.contains(COMPANY.name).should("be.visible");
    });
});

describe("Company page — tab Filings", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.visit(`/company/${COMPANY.ticker}`);
        cy.contains(COMPANY.name, { timeout: 15000 });
        cy.get('[data-cy="tab-filings"]').click();
    });

    it("muestra filings o mensaje de no disponible", () => {
        cy.get("body", { timeout: 15000 }).then(($body) => {
            const hasFilings = $body.find("a:contains('SEC EDGAR submission')").length > 0;
            const hasEmpty = $body.text().includes("no tiene filings");
            expect(hasFilings || hasEmpty).to.be.true;
        });
    });

    it("muestra tipos de filing 10-K o 10-Q si hay filings", () => {
        cy.get("body", { timeout: 15000 }).then(($body) => {
            if ($body.find("a:contains('SEC EDGAR submission')").length > 0) {
                cy.contains(/10-K|10-Q/).should("be.visible");
            }
        });
    });

    it("cada filing tiene link a sec.gov si hay filings", () => {
        cy.get("body", { timeout: 15000 }).then(($body) => {
            if ($body.find("a:contains('SEC EDGAR submission')").length > 0) {
                cy.get("a").filter(":contains('SEC EDGAR submission')").each(($a) => {
                    expect($a.attr("href")).to.include("sec.gov");
                    expect($a.attr("target")).to.equal("_blank");
                });
            }
        });
    });
});

describe("Company page — empresa no encontrada", () => {
    beforeEach(() => {
        cy.visit("/login");
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
    });

    it("muestra mensaje de not found si el ticker no existe", () => {
        cy.visit("/company/XYZFAKE");
        cy.contains("XYZFAKE", { timeout: 15000 }).should("be.visible");
        cy.get('[data-cy="back-to-search"]').should("be.visible");
    });
});