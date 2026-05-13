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

  it("redirects to /login on successful registration", () => {
    cy.intercept("POST", "/api/v1/auth/register", {
      statusCode: 201,
      body: { access_token: "fake-token", token_type: "bearer" },
    }).as("register");

    cy.get('input[type="email"]').type("newuser@example.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.get('input[type="password"]').last().type("Password123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@register").its("request.body").should("deep.equal", {
      email: "newuser@example.com",
      password: "Password123!",
    });

    cy.url().should("include", "/login");
  });

  it("shows server error message on failed registration", () => {
    cy.intercept("POST", "/api/v1/auth/register", {
      statusCode: 400,
      body: { detail: "Email already registered" },
    }).as("register");

    cy.get('input[type="email"]').type("existing@example.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.get('input[type="password"]').last().type("Password123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@register");
    cy.contains("Email already registered").should("be.visible");
  });

  it("disables the button and shows loading state while submitting", () => {
    cy.intercept("POST", "/api/v1/auth/register", (req) => {
      req.on("response", (res) => { res.setDelay(500); });
      req.reply({ statusCode: 201, body: { access_token: "fake-token", token_type: "bearer" } });
    }).as("register");

    cy.get('input[type="email"]').type("test@example.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.get('input[type="password"]').last().type("Password123!");
    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should("be.disabled").and("contain", "Creating account");
  });
});