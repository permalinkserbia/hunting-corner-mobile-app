describe('Create Post Flow', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/#/auth/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('Login').click();
    cy.url().should('include', '/timeline');
  });

  it('should create a post', () => {
    cy.visit('/#/post/create');
    cy.get('textarea').type('This is a test post');
    cy.contains('Publish').click();
    cy.url().should('include', '/timeline');
    cy.contains('This is a test post').should('be.visible');
  });
});

