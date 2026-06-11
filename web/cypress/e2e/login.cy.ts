describe("Login page", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("renders the form with all fields", () => {
    cy.get('[data-cy="auth-title"]').should("be.visible");
    cy.get('[data-cy="email-input"]').should("be.visible");
    cy.get('[data-cy="password-input"]').should("be.visible");
    cy.get('[data-cy="submit-btn"]').should("be.visible");
  });

  it("shows a link to create account", () => {
    cy.contains("No account?").should("be.visible");
    cy.get('[data-cy="register-link"]').should("have.attr", "href", "/register");
  });

  it("redirects to home on successful login and stores token", () => {
    cy.intercept("POST", "/api/v1/auth/login", {
      statusCode: 200,
      body: { access_token: "fake-token", token_type: "bearer" },
    }).as("login");

    cy.get('[data-cy="email-input"]').type("usuario@mail.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@login").its("request.body").should("deep.equal", {
      email: "usuario@mail.com",
      password: "Password123!",
    });

    cy.url().should("eq", Cypress.config("baseUrl") + "/search");
    cy.window().its("localStorage").invoke("getItem", "access_token").should("eq", "fake-token");
  });

  it("shows error message on invalid credentials (401)", () => {
    cy.intercept("POST", "/api/v1/auth/login", {
      statusCode: 401,
      body: { detail: "Invalid credentials" },
    }).as("login");

    cy.get('[data-cy="email-input"]').type("usuario@mail.com");
    cy.get('[data-cy="password-input"]').type("wrongpassword");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@login");
    cy.get('[data-cy="form-error"]').should("contain", "Invalid credentials");
  });

  it("disables the button and shows loading state while submitting", () => {
    cy.intercept("POST", "/api/v1/auth/login", (req) => {
      req.on("response", (res) => { res.setDelay(500); });
      req.reply({ statusCode: 200, body: { access_token: "fake-token", token_type: "bearer" } });
    }).as("login");

    cy.get('[data-cy="email-input"]').type("usuario@mail.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="submit-btn"]').click();

    cy.get('[data-cy="submit-btn"]').should("be.disabled").and("contain", "Signing in");
  });
});
