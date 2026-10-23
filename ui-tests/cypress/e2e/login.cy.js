const USER = { email: 'qa.user@booknook.test', password: 'Passw0rd!' };

function login(email, password) {
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('#login-btn').click();
}

describe('US1 – Log in', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test/reset');
    cy.visit('/login.html');
  });

  it('TC-1.1 valid login takes user to catalog', () => {
    login(USER.email, USER.password);

    cy.location('pathname').should('eq', '/');
    cy.get('#user-email').should('have.text', USER.email);
    cy.contains('a', 'Log out').should('be.visible');
  });

  const badLogins = [
    { name: 'wrong password', email: USER.email, password: 'WrongPass1' },
    { name: 'unknown email', email: 'nobody@booknook.test', password: USER.password }
  ];

  badLogins.forEach(({ name, email, password }) => {
    it(`TC-1.2 ${name} shows a generic error`, () => {
      login(email, password);

      cy.get('#message').should('have.text', 'Email or password is incorrect.');
      cy.location('pathname').should('eq', '/login.html');
    });
  });

  it('TC-1.3 four failed attempts, then correct password, logs in', () => {
    for (let i = 0; i < 4; i++) {
      login(USER.email, 'WrongPass1');
      cy.get('#message').should('have.text', 'Email or password is incorrect.');
    }
    login(USER.email, USER.password);

    cy.location('pathname').should('eq', '/');
  });

  it('TC-1.3 account locks on the 5th failed attempt', () => {
    for (let i = 0; i < 4; i++) {
      login(USER.email, 'WrongPass1');
      cy.get('#message').should('have.text', 'Email or password is incorrect.');
    }
    login(USER.email, 'WrongPass1');
    cy.get('#message').should('have.text', 'Account locked. Try again in 15 minutes.');

    login(USER.email, USER.password);
    cy.get('#message').should('have.text', 'Account locked. Try again in 15 minutes.');
  });

  it('TC-1.4 log out returns to catalog', () => {
    login(USER.email, USER.password);
    cy.contains('a', 'Log out').click();

    cy.location('pathname').should('eq', '/');
    cy.get('#login-link').should('be.visible');
  });

  it('session cookie is hidden from page scripts (HttpOnly)', () => {
    login(USER.email, USER.password);
    cy.location('pathname').should('eq', '/');

    cy.getCookie('session').should('have.property', 'httpOnly', true);
  });
});
