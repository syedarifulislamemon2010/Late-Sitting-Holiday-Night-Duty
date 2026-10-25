# Database Integrity Migrations Release Pack & Duplicate Resolution Policy

## ১. ওভারভিউ (Overview)
এই রিলিজ প্যাকেজটি ডাটাবেস লেভেলে ডেটার বিশুদ্ধতা (Data Integrity) নিশ্চিত করার জন্য তৈরি। এতে রয়েছে ৩টি প্রস্তাবিত মাইগ্রেশন এবং স্টেজিংয়ে প্রয়োগ করার জন্য প্রি-চেক, পোস্ট-চেক ও রোলব্যাক স্ক্রিপ্ট।

---

## ২. ডুপ্লিকেট রেজোলিউশন পলিসি (Duplicate Resolution Policy)
ইউনিক ইনডেক্স তৈরির পূর্বে যদি `scripts/check-duplicates.sql` স্ক্রিপ্ট কোনো ডুপ্লিকেট রেকর্ড শনাক্ত করে, তবে নিচের নীতিমালা অনুযায়ী রেজোলিউশন সম্পাদন করতে হবে:

### ক. Duties ডুপ্লিকেট পলিসি:
1. **অফিস আদেশ বা বিল রেফারেন্স থাকা রেকর্ড অগ্রাধিকার**:
   - যদি দুটি অভিন্ন `(employeeId, date, type)` রেকর্ডের মধ্যে একটির `orderRef` থাকে এবং অন্যটির `NULL` থাকে, তবে `orderRef` সহ রেকর্ডটি সংরক্ষণ করতে হবে এবং অন্যটিকে ট্র্যাশে পাঠাতে হবে।
2. **যদি উভয়ের বা কারোরই `orderRef` না থাকে**:
   - সর্বশেষ তৈরি হওয়া রেকর্ড (`MAX(id)`) সংরক্ষণ করা হবে।
3. **সেফটি রেজোলিউশন কুয়েরি (ড্রাই-রান)**:
   ```sql
   -- ডুপ্লিকেট রেকর্ড শনাক্তকরণ ও ট্র্যাশ আইডি তালিকা
   WITH RankedDuties AS (
     SELECT id, "employeeId", "date", "type", "orderRef",
            ROW_NUMBER() OVER (
              PARTITION BY "employeeId", "date", "type"
              ORDER BY (CASE WHEN "orderRef" IS NOT NULL THEN 1 ELSE 2 END), id DESC
            ) as rn
     FROM "Duty"
   )
   SELECT id, "employeeId", "date", "type"
   FROM RankedDuties
   WHERE rn > 1;
   ```

### খ. Employees `bankId` ডুপ্লিকেট পলিসি:
1. **সক্রিয় সেল ও ডিউটি হিস্ট্রি সম্পন্ন প্রোফাইল অগ্রাধিকার**:
   - যে `Employee` আইডির বিপরীতে `Duty` বা `LeaveApplication` অ্যাসাইনমেন্ট রয়েছে, সেটিই আসল রেকর্ড হিসেবে বিবেচিত হবে।
2. **ফাঁকা বা অব্যবহৃত ডুপ্লিকেট**:
   - অব্যবহৃত ডুপ্লিকেট প্রোফাইলের `bankId` কে `NULL` বা ট্র্যাশে স্থানান্তর করতে হবে।

---

## ৩. স্টেজিং ড্রাই-রান ও রিলিজ ধাপসমূহ (Step-by-Step Release Pack)

### ধাপ ১: প্রি-চেক স্ক্রিপ্ট রান (Pre-Check)
```bash
psql "$STAGING_DATABASE_URL" -f scripts/check-duplicates.sql
```
*শর্ত*: আউটপুটে ০ রো না আসা পর্যন্ত ইউনিক ইনডেক্স চালনা করা যাবে না।

### ধাপ ২: সেফ কনকারেন্ট মাইগ্রেশন প্রয়োগ
```bash
# ১. Duty ইউনিক ইনডেক্স
psql "$STAGING_DATABASE_URL" -f docs/migrations-proposed/0001_duties_unique_index.sql

# ২. Employee bankId পার্শিয়াল ইউনিক ইনডেক্স
psql "$STAGING_DATABASE_URL" -f docs/migrations-proposed/0002_employees_bankid_unique.sql

# ৩. মান-সংরক্ষণশীল টাকার কলাম রূপান্তর
psql "$STAGING_DATABASE_URL" -f docs/migrations-proposed/0003_duties_money_numeric_12_2.sql

# ৪. ডিউরেবল লগইন লকআউট টেবিল
psql "$STAGING_DATABASE_URL" -f docs/migrations-proposed/0004_durable_login_lockout.sql
```

### ধাপ ৩: পোস্ট-চেক ও ভ্যালিডেশন (Post-Check)
```sql
-- ইনডেক্স স্টেটাস 'valid' আছে কি না যাচাই
SELECT indexrelid::regclass, indisvalid 
FROM pg_index 
WHERE indexrelid::regclass::text IN ('idx_duties_employee_date_type_unique', 'idx_employee_bankid_unique');
```

### ধাপ ৪: ইমার্জেন্সি রোলব্যাক (Rollback)
```sql
DROP INDEX CONCURRENTLY IF EXISTS "idx_duties_employee_date_type_unique";
DROP INDEX CONCURRENTLY IF EXISTS "idx_employee_bankid_unique";
DROP TABLE IF EXISTS "LoginAttempt" CASCADE;
```
