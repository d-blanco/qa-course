const WCAG_21_AA = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } };

function logViolations(violations) {
  cy.task('log', `${violations.length} accessibility violation(s)`);
  cy.task('table', violations.map(v => ({
    id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length
  })));
}

describe('Accessibility – WCAG 2.1 AA', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
  });

  ['/', '/book.html?id=1', '/cart.html', '/login.html'].forEach(path => {
    it(`${path} has no WCAG 2.1 AA violations`, () => {
      cy.visit(path);
      cy.get('#account a').should('exist');
      cy.injectAxe();

      cy.checkA11y(null, WCAG_21_AA, logViolations);
    });
  });

  it('/cart.html with items has no WCAG 2.1 AA violations', () => {
    cy.request('POST', '/api/cart', { bookId: 1 });
    cy.visit('/cart.html');
    cy.get('#items input').should('exist');
    cy.injectAxe();

    cy.checkA11y(null, WCAG_21_AA, logViolations);
  });
});
