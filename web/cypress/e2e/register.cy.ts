describe("Register page", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("renders the form with all fields", () => {
    cy.get('[data-cy="auth-title"]').should("be.visible");
    cy.get('[data-cy="email-input"]').should("be.visible");
    cy.get('[data-cy="password-input"]').should("be.visible");
    cy.get('[data-cy="confirm-password-input"]').should("be.visible");
    cy.get('[data-cy="submit-btn"]').should("be.visible");
  });

  it("shows a link to sign in", () => {
    cy.contains("Already registered?").should("be.visible");
    cy.get('[data-cy="signin-link"]').should("have.attr", "href", "/login");
  });

  it("shows error when passwords don't match", () => {
    cy.get('[data-cy="email-input"]').type("test@example.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="confirm-password-input"]').type("Different123!");
    cy.get('[data-cy="submit-btn"]').click();
    cy.get('[data-cy="form-error"]').should("contain", "Passwords don't match");
  });

  it("logs in and redirects to / on successful registration", () => {
    cy.intercept("POST", "/api/v1/auth/register", {
      statusCode: 201,
      body: { access_token: "fake-token", token_type: "bearer" },
    }).as("register");

    cy.get('[data-cy="email-input"]').type("newuser@example.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="confirm-password-input"]').type("Password123!");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@register").its("request.body").should("deep.equal", {
      email: "newuser@example.com",
      password: "Password123!",
    });

    cy.window().its("localStorage").invoke("getItem", "access_token").should("eq", "fake-token");
    cy.url().should("not.include", "/login");
  });

  it("shows server error message on failed registration", () => {
    cy.intercept("POST", "/api/v1/auth/register", {
      statusCode: 400,
      body: { detail: "Email already registered" },
    }).as("register");

    cy.get('[data-cy="email-input"]').type("existing@example.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="confirm-password-input"]').type("Password123!");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@register");
    cy.get('[data-cy="form-error"]').should("contain", "Email already registered");
  });

  it("disables the button and shows loading state while submitting", () => {
    cy.intercept("POST", "/api/v1/auth/register", (req) => {
      req.on("response", (res) => { res.setDelay(500); });
      req.reply({ statusCode: 201, body: { access_token: "fake-token", token_type: "bearer" } });
    }).as("register");

    cy.get('[data-cy="email-input"]').type("test@example.com");
    cy.get('[data-cy="password-input"]').type("Password123!");
    cy.get('[data-cy="confirm-password-input"]').type("Password123!");
    cy.get('[data-cy="submit-btn"]').click();

    cy.get('[data-cy="submit-btn"]').should("be.disabled").and("contain", "Creating account");
  });
});
