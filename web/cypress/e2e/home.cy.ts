describe("Home", () => {
  it("renders the home page", () => {
    cy.visit("/");
    cy.contains("Aseca").should("be.visible");
  });
});