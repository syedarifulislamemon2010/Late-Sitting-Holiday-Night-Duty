/**
 * E2E Flow 1: Login -> Dashboard Navigation Flow with Invalid Credential Error Case
 */
export async function testLoginAndDashboardFlow(page: any) {
  // 1. Error Case: Try invalid login credentials
  await page.goto('/login');
  await page.fill('input[type="text"]', 'invalid_user');
  await page.fill('input[type="password"]', 'wrong_pass');
  await page.click('button[type="submit"]');
  
  // Verify error toast/message appears
  await page.waitForSelector('.text-red-500, [role="alert"]');

  // 2. Success Case: Fill valid credentials
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // 3. Verify redirected to Dashboard
  await page.waitForURL('/dashboard');
  
  // 4. Verify Dashboard key sections render properly
  const title = await page.textContent('h1');
  if (!title?.includes('লেট সিটিং')) {
    throw new Error('Dashboard title did not match expected');
  }
}

