# Runbook: Emergency Rollback Procedures

## ১. ওভারভিউ (Overview)
প্রোডাকশন ডেপ্লয়মেন্টের পর কোনো অপ্রত্যাশিত বাগ, বিল্ড ক্র্যাশ বা সার্ভিস ডাউন হলে অবিলম্বে পূর্ববর্তী স্টেবল রিলিজে রোলব্যাক করার নির্দেশিকা।

---

## ২. অ্যাপ রোলব্যাক ধাপসমূহ (Application Rollback)

### ধাপ ১: পূর্ববর্তী স্টেবল গিটে রিভার্ট
```bash
cd /var/www/duty-portal

# পূর্ববর্তী কমিট চিহ্নিত করুন
git log --oneline -n 5

# পূর্ববর্তী স্টেবল ট্যাগ বা কমিটে চেকআউট করুন
git checkout <PREVIOUS_STABLE_COMMIT_HASH>
```

### ধাপ ২: পূর্ববর্তী কোডবেস বিল্ড
```bash
npm run build
```

### ধাপ ৩: PM2 রিস্টার্ট
```bash
pm2 restart ecosystem.config.cjs
```

### ধাপ ৪: হেলথ চেক ও নিশ্চিতকরণ
```bash
curl -I http://127.0.0.1:3000/api/health
```

---

## ৩. ডাটাবেস মাইগ্রেশন রোলব্যাক (Database Rollback)

যদি কোনো ড্রাফট মাইগ্রেশন প্রয়োগ করার পর রোলব্যাক করার প্রয়োজন পড়ে:

1. **ইউনিক ইনডেক্স ড্রপ**:
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS "idx_duties_employee_date_type_unique";
   DROP INDEX CONCURRENTLY IF EXISTS "idx_employee_bankid_unique";
   ```

2. **কলাম টাইপ রিভার্স (প্রয়োজনে)**:
   ```sql
   ALTER TABLE "Duty"
     ALTER COLUMN "allowance1" TYPE double precision USING "allowance1"::double precision,
     ALTER COLUMN "allowance2" TYPE double precision USING "allowance2"::double precision,
     ALTER COLUMN "totalBill" TYPE double precision USING "totalBill"::double precision;
   ```

3. **পূর্ণ ডাটাবেস ব্যাকআপ রিস্টোর (সর্বোচ্চ জরুরি অবস্থায়)**:
   [`docs/runbooks/backup-restore-drill.md`](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/runbooks/backup-restore-drill.md) দেখুন।
