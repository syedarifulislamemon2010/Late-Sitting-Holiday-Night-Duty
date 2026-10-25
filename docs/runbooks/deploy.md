# Runbook: Production Deployment Guide (RHEL + PM2 + nginx)

## ১. ওভারভিউ (Overview)
এই রানবুকে RHEL সার্ভারে Janata Bank PLC ব্যাংকিং ডিউটি পোর্টালের প্রোডাকশন ডেপ্লয়মেন্টের ধারাবাহিক ধাপ দেওয়া হয়েছে।

## ২. ডেপ্লয়মেন্টের পূর্বশর্ত (Pre-requisites)
- Node.js version `>= 20.9` ইনস্টলড থাকতে হবে।
- PM2 গ্লোবালি ইনস্টলড থাকতে হবে (`npm install -g pm2`)।
- Nginx রিভার্স প্রক্সি পোর্ট `3000`-এ কনফিগার করা থাকতে হবে।
- প্রোডাকশন `.env` ফাইল সুরক্ষিত পারমিশন সহ (`chmod 600 .env`) বর্তমান থাকতে হবে।

---

## ৩. স্ট্যান্ডার্ড ডেপ্লয়মেন্ট পাইপলাইন (Step-by-Step Pipeline)

### ধাপ ১: গিট আপডেট গ্রহণ
```bash
cd /var/www/duty-portal
git fetch origin
git status
git checkout main
git pull origin main
```

### ধাপ ২: ডিপেনডেন্সি ও বিল্ড যাচাই (Build Phase)
```bash
# প্রোডাকশন বিল্ড ও টাইপচেক
npm run verify
```
> [!NOTE]
> `npm run verify` স্বয়ংক্রিয়ভাবে টাইপচেক, লিন্ট, ভিতেস্ট এবং নেক্সট বিল্ড সফলভাবে সমাপ্ত করবে। বিল্ডে কোনো এরর আসলে ডেপ্লয়মেন্ট থামিয়ে দিন।

### ধাপ ৩: ডাটাবেস মাইগ্রেশন অডিট (Migrate Check)
```bash
# স্টেজিং বা টেস্টে অনুমোদিত ড্রাফট মাইগ্রেশন প্রি-চেক
psql "$DATABASE_URL" -f scripts/check-duplicates.sql
```
*শর্ত*: কোনো ডুপ্লিকেট না থাকলে এবং অনুমোদিত কোনো স্কিমা মাইগ্রেশন থাকলে তা রানবুক অনুযায়ী রান করুন।

### ধাপ ৪: PM2 গ্রেসফুল রিলোড (Zero-Downtime Reload)
```bash
pm2 reload ecosystem.config.cjs --update-env
```

### ধাপ ৫: হেলথ চেক ও ভেরিফিকেশন (Health Check)
```bash
# লোকাল এইচটিটিপি স্ট্যাটাস চেক
curl -I http://127.0.0.1:3000/api/health
```
*প্রত্যাশিত আউটপুট*: HTTP `200 OK`।

ব্রাউজার থেকে নিচের পৃষ্ঠাগুলো অবিলম্বে চেক করুন:
1. `/login` — লগইন পৃষ্ঠা স্বাভাবিকভাবে লোড হচ্ছে কি না।
2. `/roster` — রোস্টার ও ডিউটি অ্যাসাইনমেন্ট টেবিল দেখা যাচ্ছে কি না।
3. `/billing` — বিল মেমো জেনারেশন ও প্রিন্ট প্রিভিউ অক্ষত আছে কি না।

---

## ৪. ফেইলিয়র ও রোলব্যাক হ্যান্ডলিং (Rollback Trigger)
যদি বিল্ড বা রিলোডের পর হেলথ চেক ফেইল করে বা লগইন ব্যাহত হয়, তবে অবিলম্বে [`docs/runbooks/rollback.md`](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/runbooks/rollback.md) অনুসরণ করুন।
