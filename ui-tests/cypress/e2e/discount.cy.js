describe('US3 – Discount code', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
  });

  it('TC-3.2 code is accepted regardless of case', () => {
    cy.visit('/');
    cy.contains('.card', 'The Pragmatic Programmer').contains('button', 'Add to Cart').click();
    cy.get('#cart-count').should('have.text', '1');
    cy.visit('/cart.html');

    cy.get('#code').type('save15');
    cy.contains('button', 'Apply').click();

    cy.get('#message').should('have.text', 'Code save15 applied.');
    cy.get('#discount').should('have.text', '-$6.00');
  });
});
