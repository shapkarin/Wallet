declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      generateWallet(): Chainable<void>;
      unlockWallet(password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.visit('/');
});

Cypress.Commands.add('generateWallet', () => {
  cy.get('[data-testid="generate-wallet-button"]').click();
});

Cypress.Commands.add('unlockWallet', (password: string) => {
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="unlock-button"]').click();
});
