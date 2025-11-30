describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/#/auth/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('Login').click();
    cy.url().should('include', '/timeline');
  });

  it('should show error on invalid credentials', () => {
    cy.visit('/#/auth/login');
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('Login').click();
    cy.contains('Login failed').should('be.visible');
  });
});

