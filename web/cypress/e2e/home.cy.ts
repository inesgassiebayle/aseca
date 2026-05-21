describe("Home", () => {
  it("renders the home page", () => {
    cy.visit("/");
    cy.contains("StockWatch").should("be.visible");
  });
});