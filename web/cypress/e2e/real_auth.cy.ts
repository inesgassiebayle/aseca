// Real E2E — auth flow hitting the actual backend (no cy.intercept)

const FIXED_USER = { email: "e2e@stockwatch.test", password: "E2Etest123!" };

describe("[E2E] Login — backend real", () => {
    before(() => {
        // Ensure the fixed test user exists
        cy.request({
            method: "POST",
            url: "/api/v1/auth/register",
            body: FIXED_USER,
            failOnStatusCode: false,
        });
    });

    it("login exitoso redirige a /search y guarda el token", () => {
        cy.visit("/login");
        cy.get('[data-cy="email-input"]').type(FIXED_USER.email);
        cy.get('[data-cy="password-input"]').type(FIXED_USER.password);
        cy.get('[data-cy="submit-btn"]').click();

        cy.url().should("include", "/search");
        cy.window()
            .its("localStorage")
            .invoke("getItem", "access_token")
            .should("be.a", "string")
            .and("have.length.greaterThan", 10);
    });

    it("credenciales inválidas muestra error sin redirigir", () => {
        cy.visit("/login");
        cy.get('[data-cy="email-input"]').type(FIXED_USER.email);
        cy.get('[data-cy="password-input"]').type("contraseniaWrong999!");
        cy.get('[data-cy="submit-btn"]').click();

        cy.get('[data-cy="form-error"]').should("be.visible");
        cy.url().should("include", "/login");
    });
});

describe("[E2E] Register — backend real", () => {
    it("registro exitoso con email nuevo guarda token y redirige", () => {
        // unique email per run to avoid duplicate conflicts
        const newEmail = `e2e_reg_${Date.now()}@test.com`;

        cy.visit("/register");
        cy.get('[data-cy="email-input"]').type(newEmail);
        cy.get('[data-cy="password-input"]').type("NewPass123!");
        cy.get('[data-cy="confirm-password-input"]').type("NewPass123!");
        cy.get('[data-cy="submit-btn"]').click();

        cy.window()
            .its("localStorage")
            .invoke("getItem", "access_token")
            .should("be.a", "string")
            .and("have.length.greaterThan", 10);
        cy.url().should("not.include", "/register");
    });

    it("email ya registrado muestra error", () => {
        cy.visit("/register");
        cy.get('[data-cy="email-input"]').type(FIXED_USER.email);
        cy.get('[data-cy="password-input"]').type(FIXED_USER.password);
        cy.get('[data-cy="confirm-password-input"]').type(FIXED_USER.password);
        cy.get('[data-cy="submit-btn"]').click();

        cy.get('[data-cy="form-error"]').should("be.visible");
        cy.url().should("include", "/register");
    });
});
