/**
 * E2E Flow 3: Bill Generation and PDF Download Flow
 */
export async function testBillingPdfFlow(page: any) {
  // 1. Navigate to Billing page
  await page.goto('/billing');
  
  // 2. Select Orders tab
  await page.click('button:has-text("অফিস আদেশ")');
  
  // 3. Generate Bill
  const printBtn = await page.waitForSelector('button:has-text("প্রিন্ট প্রিভিউ")');
  if (printBtn) {
    await printBtn.click();
  }
}
