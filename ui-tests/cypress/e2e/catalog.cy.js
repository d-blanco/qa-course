describe('Locators', () => {
  it('adds a specific book to the cart', () => {
    cy.request('POST', '/api/test/reset');
    cy.visit('/');
    cy.contains('[data-cy=book-card]', 'Pride and Prejudice')
      .find('[data-cy=add-to-cart]')
      .click();

    cy.get('#cart-count').should('have.text', '1');
  });
});

describe('US2 – Search the catalog', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.visit('/');
  });

  ['prag', 'PRAG', 'Pragmatic'].forEach(term => {
    it(`TC-2.1 search "${term}" finds the book`, () => {
      cy.get('[data-cy=search-input]').type(`${term}{enter}`);

      cy.get('[data-cy=book-card]')
        .should('have.length', 1)
        .and('contain', 'The Pragmatic Programmer');
    });
  });

  it('TC-2.3 empty search pages 20 books at a time', () => {
    cy.get('[data-cy=book-card]').should('have.length', 20);
    cy.get('[data-cy=page-info]').should('have.text', 'Page 1 of 2');
    cy.get('[data-cy=prev-page]').should('be.disabled');

    cy.get('[data-cy=next-page]').click();

    cy.get('[data-cy=book-card]').should('have.length', 10);
    cy.get('[data-cy=page-info]').should('have.text', 'Page 2 of 2');
    cy.get('[data-cy=next-page]').should('be.disabled');
  });

  it('TC-2.4 search with no matches shows a message', () => {
    cy.get('[data-cy=search-input]').type('zzz{enter}');

    cy.get('[data-cy=no-results]').should('have.text', 'No books found.');
    cy.get('[data-cy=book-card]').should('not.exist');
  });
});
