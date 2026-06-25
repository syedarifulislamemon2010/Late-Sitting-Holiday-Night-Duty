# User Manual & Operator Guide

This manual describes step-by-step procedures for administrators and cell operators using the LHN Portal.

---

## 1. Administrators Guide

### A. Creating User Accounts
1. Sign in to the portal using an account mapped to the `ADMIN` role.
2. Go to the **Users** directory screen.
3. Click the **Add Operator** button.
4. Input the user's details:
   - Name (in Bengali)
   - Unique login username (e.g., Bank ID code `026795`)
   - Bcrypt password
   - Mobile number
   - Cell assignments role configuration (**PRIMARY / মূল দায়িত্ব**, **ADDITIONAL / অতিরিক্ত দায়িত্ব**, or **INCHARGE / ইনচার্জ**).
5. Map the user to their corresponding **Cell(s)**.
6. Click **Submit** to create the user account.

### B. Recycle Bin Recovery (Trash)
1. Go to the **Trash** / **রিসাইকেল বিন** screen from the sidebar menu.
2. The list displays soft-deleted records (Employees, Duties, Executives, Cells, etc.) along with deletion audits (deleted by, deleted at).
3. Click the **Restore** button next to any soft-deleted item.
4. The item is serialized back to its original table, and all child relations are restored.

---

## 2. Cell Operators Guide

### A. Duty Roster Assignment
1. Open the **Roster** / **ডিউটি রোস্টার** page from the left sidebar.
2. Select the **Duty Category** dropdown (e.g., Late Sitting / লেট সিটিং).
   - *Note: Date and Employee input panels will remain locked until a category is selected.*
3. Select the target **Employee(s)**.
4. Select the **Date Range** (or individual dates) on the calendar picker.
5. Click **Submit**.
   - *Validation Engine:* The system automatically checks for overlapping duty assignments or approved leaves. If collisions are found, the request is rejected with a Bengali description of the conflict.

### B. Generating Monthly Billing Memos
1. Go to the **Billing** / **বিল নথি** page.
2. Select the mapped operational cell and billing period.
3. Click the **Create Bill Memo** button.
4. The system aggregates all unbilled duties for that cell:
   - Calculates conveyance and entertainment allowances based on shift categories (৳300/day for Late Sitting, ৳500/day for Holiday, ৳1000/day for Night Shift).
   - Enforces the ৳7,500 billing split limits: any total exceeding ৳7,500 is programmatically partitioned into chronological, compliant sub-orders with staggered reference dates.
5. Review and click **Print/Download** to compile standard high-density Legal-size PDF billing sheets.
