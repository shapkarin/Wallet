describe('Wallet Creation Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the welcome page', () => {
    cy.contains('TrustWallet').should('be.visible');
  });

  it('should allow user to generate a new wallet', () => {
    cy.get('[data-testid="generate-wallet-button"]').should('exist');
  });

  it('should show wallet list after creation', () => {
    cy.get('[data-testid="wallet-list"]').should('exist');
  });
});
