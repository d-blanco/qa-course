// BookNook shop suite, written in a hurry the week before beta.
// "It passes on my machine." Mostly.

let chosenBook;

describe('BookNook shop', () => {
  before(() => {
    cy.request('POST', '/api/test/reset');
  });

  it('F1 search finds The Pragmatic Programmer', () => {
    cy.visit('/');
    cy.get('[data-cy=search-input]').type('prag{enter}');
    cy.wait(500);
    cy.get('[data-cy=book-card]').then($cards => {
      expect($cards).to.have.length(1);
      expect($cards.text()).to.contain('The Pragmatic Programmer');
    });
  });

  it('F2 adds Pride and Prejudice to the cart', () => {
    cy.visit('/');
    cy.get('#results > div:nth-child(6) > button').click();
    cy.get('header > nav > a:nth-child(2) > span').should('have.text', '1');
  });

  it('F3a remembers the first book in the catalog', () => {
    cy.visit('/');
    cy.get('[data-cy=book-card] h3').first().invoke('text').then(title => {
      chosenBook = title;
    });
  });

  it('F3b details page shows the chosen book', () => {
    cy.visit('/');
    cy.contains('a', chosenBook).click();
    cy.get('h1').should('have.text', chosenBook);
  });

  it('F4 a book can be added from its details page', () => {
    const id = Math.floor(Math.random() * 30) + 1; // random book = more coverage!
    cy.visit(`/book.html?id=${id}`);
    cy.get('#add').click();
    cy.get('#message').should('have.text', 'Added to cart.');
  });

  it('F5a account locks after 5 failed logins', () => {
    cy.visit('/login.html');
    for (let i = 0; i < 5; i++) {
      cy.get('#email').clear().type('qa.user@booknook.test');
      cy.get('#password').clear().type('wrong');
      cy.get('#login-btn').click();
    }
    cy.get('#message').should('have.text', 'Account locked. Try again in 15 minutes.');
  });

  it('F5b user can log in', () => {
    cy.visit('/login.html');
    cy.get('#email').type('qa.user@booknook.test');
    cy.get('#password').type('Passw0rd!');
    cy.get('#login-btn').click();
    cy.get('#user-email').should('have.text', 'qa.user@booknook.test');
  });
});
