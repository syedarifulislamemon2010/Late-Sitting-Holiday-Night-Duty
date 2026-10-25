# Runbook: Database Migrations Management (Drizzle ORM)

## ১. উদ্দেশ্য ও পটভূমি (Objective & Background)

বর্তমানে ডেভেলপমেন্টে `drizzle-kit push` ব্যবহৃত হয়ে আসছে, যা সরাসরি লোকাল বা টেস্ট ডাটাবেসে স্কিমা সিঙ্ক করে। কিন্তু **RHEL প্রোডাকশন পরিবেশে** `drizzle-kit push` চালানো বিপজ্জনক, কারণ:
1. এটি কোনো ডাউন বা রোলব্যাক স্ক্রিপ্ট তৈরি করে না।
2. কোনো সতর্কবার্তা ছাড়া কলাম ড্রপ বা টাইপ পরিবর্তনের ঝুঁকি থাকে।
3. প্রোডাকশনে কোন কোন ভার্সন কখন প্রয়োগ হয়েছে তার কোনো ট্র্যাকযোগ্য হিস্ট্রি বা অডিট ট্রেইল থাকে না।

এই রানবুকে বর্তমান স্কিমার উপর ভিত্তি করে নিরাপদ **Baseline Migration** তৈরি এবং প্রোডাকশনে **`drizzle-kit migrate`** চালনার ধাপে ধাপে গাইডলাইন দেওয়া হলো।

> [!CAUTION]
> **অলঙ্ঘনীয় নিয়ম**: প্রোডাকশন ডাটাবেসে সরাসরি কোনো কমান্ড চালাবেন না। যেকোনো মাইগ্রেশন প্রথমে লোকাল বা স্টেজিং ডাটাবেসে ড্রাই-রান দিয়ে ভেরিফাই করতে হবে।

---

## ২. স্টেজ ১: বর্তমান স্কিমার Baseline Migration তৈরি (Local / Dev Machine)

### ধাপ ১: বর্তমান স্কিমা ও মাইগ্রেশন স্ন্যাপশট যাচাই
প্রথমে লোকাল মেশিনে স্কিমার স্টেট নিশ্চিত করুন:
```bash
# স্কিমা ফাইল ও টাইপস্ক্রিপ্ট কম্পাইলেশন যাচাই
npx tsc --noEmit
```

### ধাপ ২: Drizzle-Kit জেনারেট কমান্ড চালনা
`drizzle.config.ts` অনুযায়ী মাইগ্রেশন ফাইল তৈরি করার জন্য লোকাল টার্মিনালে চালান:
```bash
npx drizzle-kit generate
```
*ফলাফল*:
- `src/db/migrations/` ডিরেক্টরিতে নতুন একটি সংস্করণযুক্ত এসকিউএল ফাইল তৈরি হবে (যেমন: `0008_xxx.sql`)।
- `src/db/migrations/meta/` ডিরেক্টরিতে স্ন্যাপশট ও জার্নাল আপডেট হবে।

### ধাপ ৩: তৈরি হওয়া SQL ও Drizzle জেনারেটেড ফাইল পর্যবেক্ষণ
জেনারেট হওয়া SQL ফাইলটি ওপেন করে রিভিউ করুন:
- কোনো টেবিল বা কলাম অনাকাঙ্ক্ষিতভাবে ড্রপ বা পরিবর্তন হচ্ছে কি না।
- ডেটাবেসের существу স্ট্রাকচারের সাথে এটি সামঞ্জস্যপূর্ণ কি না।

---

## ৩. স্টেজ ২: স্টেজিং ডাটাবেসে ড্রাই-রান ও ভেরিফিকেশন (Staging Dry-Run)

প্রোডাকশন ডাটাবেসে কোনো পরিবর্তন আনার আগে স্টেজিং পরিবেশে (যা প্রোডাকশনের ডেটার অনুরূপ রিপ্লিকা) নিচের ধাপগুলো সম্পন্ন করুন:

### ধাপ ১: ডুপ্লিকেট ডেটা অডিট রান
স্টেজিং ডাটাবেসে `scripts/check-duplicates.sql` স্ক্রিপ্টটি চালান:
```bash
psql "$STAGING_DATABASE_URL" -f scripts/check-duplicates.sql
```
*শর্ত*: কোনো ডুপ্লিকেট রেকর্ড থাকলে ইউনিক ইনডেক্স মাইগ্রেশন ফেইল করবে। তাই আগে ডুপ্লিকেট সমাধান করতে হবে।

### ধাপ ২: স্টেজিং ব্যাকআপ গ্রহণ
```bash
pg_dump "$STAGING_DATABASE_URL" -Fc -f staging_backup_before_migration.dump
```

### ধাপ ৩: মাইগ্রেশন প্রয়োগ ও ভেরিফিকেশন
স্টেজিংয়ে মাইগ্রেশন স্ক্রিপ্ট চালান:
```bash
# অথবা কাস্টম মাইগ্রেশন এক্সিকিউটর স্ক্রিপ্ট
npm run db:migrate # (যদি স্ক্রিপ্ট কনফিগার করা থাকে)
```

---

## ৪. স্টেজ ৩: প্রোডাকশন ডেপ্লয়মেন্ট রানবুক (RHEL Production Runbook)

### ধাপ ১: প্রোডাকশন ডাটাবেস সম্পূর্ণ ব্যাকআপ গ্রহণ
```bash
# RHEL সার্ভারে প্রোডাকশন ব্যাকআপ
pg_dump "$DATABASE_URL" -Fc -v -f "/backup/db/portal_prod_$(date +%Y%m%d_%H%M%S).dump"
```

### ধাপ ২: ডাটাবেস লকিং বিবেচনা ও কনকারেন্ট ইনডেক্স
প্রোডাকশনে লাইভ ট্রাফিকের সময় টেবিল লক এড়াতে প্রস্তাবিত ইউনিক ইনডেক্সগুলো `CONCURRENTLY` মোডে তৈরি করার নির্দেশ দেওয়া হয়েছে:
```sql
-- Duty ইউনিক ইনডেক্স
\i docs/migrations-proposed/0001_duties_unique_index.sql

-- Employee ইউনিক ইনডেক্স
\i docs/migrations-proposed/0002_employees_bankid_unique.sql
```

### ধাপ ৩: কোড আপডেট ও PM2 রিলোড
```bash
git pull origin main
npm run build
pm2 reload admin-portal
```

### ধাপ ৪: পোস্ট-মাইগ্রেশন স্বাস্থ্য পরীক্ষা
- লগইন এবং সেশন সচল আছে কি না যাচাই (`/login`)।
- রোস্টার ভিউ ও ডিউটি অ্যাসাইনমেন্ট চেক (`/roster`)।
- বিলিং এবং অফিস আদেশের প্রিন্ট প্রিভিউ যাচাই (`/billing`, `/documents`)।

---

## ৫. ইমার্জেন্সি রোলব্যাক প্ল্যান (Emergency Rollback Plan)

যদি কোনো কারণে মাইগ্রেশনের পর সিস্টেমে ত্রুটি বা ডেটা অসঙ্গতি দেখা দেয়:

1. **ইন্ডেক্স রোলব্যাক**:
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS "idx_duties_employee_date_type_unique";
   DROP INDEX CONCURRENTLY IF EXISTS "idx_employee_bankid_unique";
   ```
2. **কলাম টাইপ রোলব্যাক (প্রয়োজনে)**:
   ```sql
   ALTER TABLE "Duty"
     ALTER COLUMN "allowance1" TYPE double precision USING "allowance1"::double precision,
     ALTER COLUMN "allowance2" TYPE double precision USING "allowance2"::double precision,
     ALTER COLUMN "totalBill" TYPE double precision USING "totalBill"::double precision;
   ```
3. **ফুল ব্যাকআপ রিস্টোর (সর্বোচ্চ জরুরি অবস্থায়)**:
   ```bash
   pg_restore --clean --no-acl --no-owner -d "$DATABASE_URL" /backup/db/portal_prod_<timestamp>.dump
   pm2 restart admin-portal
   ```
