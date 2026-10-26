# Runbook: RBAC Rollout & Audit Assessment Guide

## ১. ওভারভিউ (Overview)
Janata Bank PLC ডিউটি পোর্টালে RBAC (Role-Based Access Control) নীতিমালার প্রভাব পরীক্ষা করার জন্য একটি নিরাপদ **Audit-Only** মূল্যায়ন ব্যবস্থা সংযোজন করা হয়েছে। 

- ডিফল্ট এনভায়রনমেন্ট ভেরিয়েবল: `RBAC_MODE=audit`
- কোনো রিকোয়েস্ট ব্লক বা আটকে দেওয়া হয় না।
- অনুমোদনের নীতি লংঘনকারী রিকোয়েস্টের ক্ষেত্রে শুধুমাত্র সার্ভার লগে `[RBAC AUDIT] would-deny` আকারে বিস্তারিত লিপিবদ্ধ হয়।

---

## ২. অডিট লগ পর্যবেক্ষণ ও "would-deny" ট্র্যাকিং

RHEL সার্ভারে PM2 লগ ফাইলের মাধ্যমে অডিট ইভেন্ট পর্যবেক্ষণ করুন:
```bash
# PM2 এরর ও আউটপুট লগ থেকে would-deny ফিল্টার করুন (PM2 প্রসেস office-work)
pm2 logs office-work --lines 200 | grep "\[RBAC AUDIT\] would-deny"

# অথবা সরাসরি লগ ফাইল থেকে:
tail -f ./logs/pm2-out.log | grep "\[RBAC AUDIT\] would-deny"

# মোট would-deny ইভেন্ট সংখ্যা গণনা:
grep -c "\[RBAC AUDIT\] would-deny" ./logs/pm2-out.log ~/.pm2/logs/office-work*.log 2>/dev/null
```

### লগের সঠিক ফরম্যাট
```text
[RBAC AUDIT] would-deny user='<username>' role='<role>' action='<action>' method='<method>' path='<path>'
```

---

## ৩. ২-সপ্তাহের অডিট ডেটা বিশ্লেষণের কার্যপদ্ধতি

উৎপাদন পরিবেশে ২ সপ্তাহ অডিট লগ রান করার পর নিচের স্ক্রিপ্টের মাধ্যমে সারসংক্ষেপ সংগ্রহ করুন:
```bash
grep "\[RBAC AUDIT\] would-deny" ./logs/pm2*.log ~/.pm2/logs/office-work*.log 2>/dev/null | awk -F"would-deny " '{print $2}' | sort | uniq -c | sort -nr > /tmp/rbac-deny-summary.txt
cat /tmp/rbac-deny-summary.txt
```

### সিদ্ধান্ত গ্রহণের মানদণ্ড (Decision Matrix)
1. **যদি বৈধ ইউজার অ্যাকশন `would-deny` এর তালিকায় আসে**:
   - যেমন: কোনো সাধারণ সেল অপারেটর বৈধ কারণে কোনো রুট কল করছেন কিন্তু RBAC ম্যাট্রিক্সে তা অনুপস্থিত।
   - **পদক্ষেপ**: এনফোর্স করার আগে `src/permissions/rbac.ts`-এ উক্ত রোলকে পারমিশন প্রদান করুন।
2. **যদি অননুমোদিত অ্যাকশন দেখা যায়**:
   - যেমন: সাধারণ ইউজার `/api/users` এ ইউজার পরিবর্তনের চেষ্টা করছেন।
   - **পদক্ষেপ**: লগ ট্রেইল অনুযায়ী সংশ্লিষ্ট কর্মকর্তাকে নোটিফাই করুন এবং নিরাপত্তা নিরীক্ষা সম্পন্ন করুন।
3. **এনফোর্সমেন্ট সিদ্ধান্ত**:
   - অন্তত ২ সপ্তাহ ধারাবাহিকভাবে শূন্য অনাকাঙ্ক্ষিত `would-deny` পাওয়ার পরেই কেবল এনফোর্সমেন্ট চালুর সিদ্ধান্ত নেওয়া যাবে।
