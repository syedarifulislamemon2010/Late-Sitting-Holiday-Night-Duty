/**
 * E2E Flow 5: Leave Application Flow
 */
export async function testLeaveApplicationFlow(page: any) {
  // 1. Navigate to Leave page
  await page.goto('/leave');
  
  // 2. Select Leave Type
  await page.click('input[value="CASUAL"]');
  
  // 3. Verify Live Print View generates without error
  const printSheet = await page.waitForSelector('#printable-leave-sheet');
  if (!printSheet) {
    throw new Error('Print sheet not found');
  }
}
