# Runbook: Production Incident Management & Triage

## ১. ইনসিডেন্ট পর্যায়ক্রম (Severity Levels)
- **SEV-1 (Critical)**: পুরো পোর্টাল অচল, ব্যবহারকারী লগইন করতে পারছেন না, অথবা ডাটাবেস সংযোগ বিচ্ছিন্ন।
- **SEV-2 (Major)**: নির্দিষ্ট গুরুত্বপূর্ণ ফিচার কাজ করছে না (যেমন: অফিস আদেশ সেভ বা প্রিন্ট প্রিভিউ ব্যর্থ, বিল ক্যালকুলেটর হ্যাং)।
- **SEV-3 (Minor)**: কোনো নন-ক্রিটিক্যাল পৃষ্ঠা বা রিপোর্টে লেআউট অসঙ্গতি।

---

## ২. দ্রুত ডায়াগনস্টিক ট্রায়াজ (Quick Triage Steps on RHEL)

### ধাপ ১: সার্ভিস ও প্রসেস স্ট্যাটাস চেক
```bash
# PM2 প্রসেসের স্থিতি ও মেমোরি কনজাম্পশন দেখুন
pm2 list
pm2 describe duty-portal
```
- যদি স্ট্যাটাস `errored` বা `restarting` দেখায়:
  ```bash
  pm2 logs duty-portal --lines 100 --err
  ```

### ধাপ ২: ডাটাবেস সংযোগ ও স্বাস্থ্য পরীক্ষা
```bash
# পোস্টগ্রিস সার্ভিস স্ট্যাটাস
systemctl status postgresql-16

# অ্যাপ্লিকেশন হেলথ চেক
curl -s -i http://127.0.0.1:3000/api/health
```

### ধাপ ৩: Nginx রিভার্স প্রক্সি লগ ও স্ট্যাটাস চেক
```bash
systemctl status nginx
tail -n 50 /var/log/nginx/error.log
```

---

## ৩. সাধারণ ঘটনা ও তাৎক্ষণিক প্রতিকার (Common Incidents & Mitigations)

### ১. মেমোরি লিক বা High Memory Usage
- **লক্ষণ**: প্রসেস বারবার ক্র্যাশ হচ্ছে বা রেসপন্স স্লো।
- **প্রতিকার**: `ecosystem.config.cjs`-এ `max_memory_restart: '1G'` কনফিগার করা রয়েছে। তবে জরুরি ভিত্তিতে প্রসেস রিলোড করতে:
  ```bash
  pm2 reload duty-portal
  ```

### ২. লগইন লকআউট সমস্যা (In-Memory Lockout)
- **লক্ষণ**: কোনো ব্যবহারকারী পরপর ভুল পাসওয়ার্ড দিয়ে ১৫ মিনিটের জন্য লকআউট হয়ে গেছেন কিন্তু জরুরি অ্যাক্সেস প্রয়োজন।
- **প্রতিকার**: যেহেতু লকআউট স্টেট ইন-মেমোরিতে সংরক্ষিত (`src/lib/auth-options.ts`), তাই PM2 রিলোড দিলে ক্যাশ রিসেট হয়ে যায়:
  ```bash
  pm2 reload duty-portal
  ```

### ৩. 502 Bad Gateway (Nginx)
- **লক্ষণ**: ব্রাউজারে Nginx 502 এরর দেখাচ্ছে।
- **প্রতিকার**: Next.js অ্যাপ ক্র্যাশ করে পোর্ট 3000 বন্ধ হয়ে থাকলে এটি ঘটে।
  ```bash
  pm2 restart duty-portal
  ```
