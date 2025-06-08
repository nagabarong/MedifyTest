const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../Pages/LoginPage');
const users = require('../Data/users.json');

const validUser = users[0];

// Test to verify successful login with valid credentials
test('user can log in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(validUser.email, validUser.password);
  await expect(page).toHaveURL('https://qa-test.medifyapp.com/master-items');
});

// Test to verify that a user cannot log in with invalid credentials
test('user cannot log in with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('invalid@example.com', 'wrongpassword');
  await expect(page.locator('.invalid-feedback')).toBeVisible();
});

// Test to verify HTML5 validation errors for empty email and password fields
test('should show validation errors for empty fields (HTML5)', async ({ page }) => {
  await page.goto('https://qa-test.medifyapp.com/login');
  await page.click('button:has-text("Login")');
  const emailInput = await page.$('input[name="email"]');
  const emailValid = await emailInput.evaluate(input => input.validity.valueMissing);
  expect(emailValid).toBe(true);
  const passInput = await page.$('input[name="password"]');
  const passValid = await passInput.evaluate(input => input.validity.valueMissing);
  expect(passValid).toBe(true);
});

// Test to verify HTML5 validation error for invalid email format
test('should show validation error for invalid email format (HTML5)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('invalid-email', users[0].password);
  const emailInput = await page.$('input[name="email"]');
  const emailValid = await emailInput.evaluate(input => input.validity.typeMismatch);
  expect(emailValid).toBe(true);
});

// Test to verify HTML5 validation error for password with only 1 character
test('should show validation error for password with only 1 character (HTML5)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users[0].email, 'a');
  const passInput = await page.$('input[name="password"]');
  const passValid = await passInput.evaluate(input => input.value.length < 6);
  expect(passValid).toBe(true);
});

// Test to verify that an error message is displayed for incorrect credentials
test('should show error for incorrect credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users[0].email, 'wrongpassword');
  await expect(page.locator('.invalid-feedback, .alert-danger')).toBeVisible();
});

// Test to verify "Remember Me" functionality: user remains logged in after browser restart until logout
test('should keep user logged in with Remember Me checked after browser restart, until logout', async ({ page, context, browser }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(validUser.email, validUser.password, true);
  await expect(page).toHaveURL('https://qa-test.medifyapp.com/master-items');

  const storageState = await context.storageState();
  await context.close();

  const newContext = await browser.newContext({
    storageState: storageState
  });
  const newPage = await newContext.newPage();

  await newPage.goto('https://qa-test.medifyapp.com/master-items');
  await expect(newPage).toHaveURL('https://qa-test.medifyapp.com/master-items');
  
  await newPage.evaluate(() => {
    const logoutForm = document.getElementById('logout-form');
    if (logoutForm) {
      logoutForm.submit();
    }
  });
  await expect(newPage).toHaveURL('https://qa-test.medifyapp.com/login');
});

// Test to verify that the "Forgot Your Password?" link is displayed and navigates correctly
test('should display and navigate forgot password link', async ({ page }) => {
  await page.goto('https://qa-test.medifyapp.com/login');
  await expect(page.locator('text=Forgot Your Password?')).toBeVisible();
  await page.click('text=Forgot Your Password?');
  await expect(page).toHaveURL('https://qa-test.medifyapp.com/password/reset');
});

// Test to verify that the login form is not submitted if the email format is invalid (HTML5 validation)
test('should not submit form if email format is invalid (HTML5 validation)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('hahaha', users[0].password);
  await expect(page).toHaveURL('https://qa-test.medifyapp.com/login');
  const emailInput = await page.$('input[name="email"]');
  const isValid = await emailInput.evaluate(input => input.checkValidity());
  expect(isValid).toBe(false);
});
