export {};

declare global {
    namespace Cypress {
        interface Chainable {
            login(): Chainable<void>;
        }
    }
}

Cypress.Commands.add("login", () => {
    cy.intercept("POST", "/api/v1/auth/login", {
        statusCode: 200,
        body: { access_token: "fake-token", token_type: "bearer" },
    }).as("login");

    cy.visit("/login");
    cy.get('input[type="email"]').type("usuario@mail.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.get('button[type="submit"]').click();
    cy.wait("@login");
});