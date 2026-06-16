describe("Register page", () => {
    beforeEach(() => {
        cy.visit("/register");
    });

    it("renders the form with all fields", () => {
        cy.contains("Create account").should("be.visible");
        cy.get('input[type="email"]').should("be.visible");
        cy.get('input[type="password"]').should("have.length", 2);
        cy.get('button[type="submit"]').contains("Create account").should("be.visible");
    });

    it("shows a link to sign in", () => {
        cy.contains("Already registered?").should("be.visible");
        cy.contains("Sign in").should("have.attr", "href", "/login");
    });

    it("shows error when passwords don't match", () => {
        cy.get('input[type="email"]').type("test@example.com");
        cy.get('input[type="password"]').first().type("Password123!");
        cy.get('input[type="password"]').last().type("Different123!");
        cy.get('button[type="submit"]').click();
        cy.contains("Passwords don't match").should("be.visible");
    });

    it("registra usuario nuevo y redirige", () => {
        const email = `cypress_${Date.now()}@test.com`;
        cy.get('input[type="email"]').type(email);
        cy.get('input[type="password"]').first().type("Password123!");
        cy.get('input[type="password"]').last().type("Password123!");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/register");
        cy.window().its("localStorage").invoke("getItem", "access_token").should("exist");
    });

    it("muestra error si el email ya está registrado", () => {
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').first().type("Password123!");
        cy.get('input[type="password"]').last().type("Password123!");
        cy.get('button[type="submit"]').click();
        cy.contains("already registered", { matchCase: false }).should("be.visible");
    });
});