describe("Login page", () => {
    beforeEach(() => {
        cy.visit("/login");
    });

    it("renders the form with all fields", () => {
        cy.contains("Sign in").should("be.visible");
        cy.get('input[type="email"]').should("be.visible");
        cy.get('input[type="password"]').should("be.visible");
        cy.get('button[type="submit"]').contains("Sign in").should("be.visible");
    });

    it("shows a link to create account", () => {
        cy.contains("No account?").should("be.visible");
        cy.contains("Register").should("have.attr", "href", "/register");
    });

    it("redirige y guarda token con credenciales válidas", () => {
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("admin123");
        cy.get('button[type="submit"]').click();
        cy.url().should("not.include", "/login");
        cy.window().its("localStorage").invoke("getItem", "access_token").should("exist");
    });

    it("muestra error con credenciales inválidas", () => {
        cy.get('input[type="email"]').type("admin@gmail.com");
        cy.get('input[type="password"]').type("wrongpassword");
        cy.get('button[type="submit"]').click();
        cy.contains("Invalid credentials", { matchCase: false }).should("be.visible");
    });
});