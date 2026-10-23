describe('Visual regression', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.viewport(1280, 800);
  });

  it('book details page matches the baseline', () => {
    cy.visit('/book.html?id=1');
    cy.contains('h1', 'The Pragmatic Programmer').should('be.visible');
    cy.get('#login-link').should('be.visible');

    cy.compareSnapshot('book-details');
  });
});
