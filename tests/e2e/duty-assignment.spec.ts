/**
 * E2E Flow 2: Duty Assignment Flow
 */
export async function testDutyAssignmentFlow(page: any) {
  // 1. Navigate to Roster/Dashboard
  await page.goto('/roster');
  
  // 2. Select Date / Slot in calendar grid
  await page.click('.calendar-slot:first-child');
  
  // 3. Assign Duty for employee
  await page.click('button:has-text("ডিউটি যোগ করুন")');
  
  // 4. Verify duty appears in list
  await page.waitForSelector('.duty-badge');
}
