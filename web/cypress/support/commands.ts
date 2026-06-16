export {};

declare global {
    namespace Cypress {
        interface Chainable {
            login(): Chainable<void>;
            loginReal(): Chainable<void>;
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

// Real E2E login — hits the actual backend, no intercept.
// Ensures the test user exists, then injects the real token into localStorage
// before the first page load so all subsequent cy.visit() calls are authenticated.
Cypress.Commands.add("loginReal", () => {
    const email = "e2e@stockwatch.test";
    const password = "E2Etest123!";

    cy.request({
        method: "POST",
        url: "/api/v1/auth/register",
        body: { email, password },
        failOnStatusCode: false, // 400 = already exists, that's fine
    }).then(() => {
        cy.request({
            method: "POST",
            url: "/api/v1/auth/login",
            body: { email, password },
        }).then((res) => {
            const token = res.body.access_token;
            cy.visit("/", {
                onBeforeLoad(win) {
                    win.localStorage.setItem("access_token", token);
                },
            });
        });
    });
});