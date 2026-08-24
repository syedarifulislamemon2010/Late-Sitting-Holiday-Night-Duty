/**
 * E2E Flow 4: Employee Creation & Editing Flow
 */
export async function testEmployeeManagementFlow(page: any) {
  // 1. Navigate to Employee directory
  await page.goto('/employees');
  
  // 2. Click Add Employee
  await page.click('button:has-text("নতুন কর্মকর্তা যোগ করুন")');
  
  // 3. Fill details
  await page.fill('#emp_name', 'জনাব মোঃ পরীক্ষামূলক কর্মকর্তা');
  await page.fill('#emp_designation', 'অফিসার-আইটি');
  await page.click('button[type="submit"]');
  
  // 4. Verify employee exists in list
  await page.waitForSelector('text=জনাব মোঃ পরীক্ষামূলক কর্মকর্তা');
}
