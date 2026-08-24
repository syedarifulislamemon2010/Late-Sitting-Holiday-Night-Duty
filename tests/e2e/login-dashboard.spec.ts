/**
 * E2E Flow 1: Login -> Dashboard Navigation Flow
 */
export async function testLoginAndDashboardFlow(page: any) {
  // 1. Navigate to Login Page
  await page.goto('/login');
  
  // 2. Fill login credentials
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
