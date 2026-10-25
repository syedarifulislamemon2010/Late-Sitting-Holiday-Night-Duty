# Runbook: Backup and Restore Drill (pg_dump Based)

## ১. ওভারভিউ ও ঝুঁকি বিশ্লেষণ (Overview & Risks)

### ⚠️ JSON/Text ভিত্তিক ব্যাকআপের মারাত্মক ঝুঁকি (Risk of JSON/Custom Table Dump)
- অ্যাপ্লিকেশন লেভেলে কাস্টম স্ক্রিপ্ট দিয়ে JSON আকারে ডাটা ডাম্প বা রিস্টোর করার কিছু বড় ঝুঁকি রয়েছে:
  1. **Foreign Key Cascade & Order of Insertion Error**: ফরেন কি রেফারেন্স ডিপেনডেন্সি ঠিকমতো মেইনটেইন না হলে (`Cell` -> `Employee` -> `Duty`) রিস্টোর ফেইল করে।
  2. **Data Type Degradation**: JSON সিরিয়ালাইজেশনের সময় `Date` অবজেক্ট স্ট্রিংয়ে পরিণত হওয়া বা ডাবল প্রিসিশনের রাউন্ডিং এরর ঘটা।
  3. **Auto-Increment Sequence Desynchronization**: পোস্টগ্রিসে `serial` আইডিগুলো রিস্টোর করার পর `pg_get_serial_sequence` বা কারেন্ট সিকোয়েন্স আপডেট না হলে নতুন এন্ট্রি ইনসার্ট করার সময় `duplicate key value violates unique constraint` এরর আসে।
- **সমাধান**: প্রোডাকশনে সর্বদা নেটিভ পোস্টগ্রিস বাইনারি টুলস (`pg_dump` ও `pg_restore`) ব্যবহার করতে হবে।

---

## ২. স্ট্যান্ডার্ড ব্যাকআপ কার্যপদ্ধতি (Standard Backup Drill)

### ধাপ ১: প্রোডাকশন ব্যাকআপ গ্রহণ (pg_dump Custom Format)
```bash
BACKUP_DIR="/var/backups/postgres"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/duty_portal_prod_${TIMESTAMP}.dump"

# Custom compressed format with blob & OIDs
pg_dump "$DATABASE_URL" -Fc -v -f "$BACKUP_FILE"

# ব্যাকআপের সাইজ ও অস্তিত্ব যাচাই
ls -lh "$BACKUP_FILE"
```

---

## ৩. স্ট্যান্ডার্ড রিস্টোর কার্যপদ্ধতি (Standard Restore Drill on Staging/Drill DB)

> [!CAUTION]
> কখনোই সোজাসুজি প্রোডাকশন ডাটাবেসে ড্রিল চালাবেন না। ড্রিল সবসময় লোকাল বা স্টেজিং ডাটাবেসে চালাতে হবে।

### ধাপ ১: ড্রিল টার্গেট ডাটাবেস প্রস্তুতকরণ
```bash
# স্টেজিং ডাটাবেসের সংযোগ বন্ধ ও রিস্টোর প্রস্তুতি
psql "$DRILL_DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### ধাপ ২: pg_restore চালানো
```bash
pg_restore -v --clean --no-acl --no-owner -d "$DRILL_DATABASE_URL" "$BACKUP_FILE"
```

### ধাপ ৩: পোস্ট-রিস্টোর ভ্যালিডেশন কোয়েরি (Data Integrity Check)
```sql
-- ১. মোট রেকর্ড সংখ্যা যাচাই
SELECT 'Cell' AS tbl, COUNT(*) FROM "Cell"
UNION ALL
SELECT 'Employee', COUNT(*) FROM "Employee"
UNION ALL
SELECT 'Duty', COUNT(*) FROM "Duty"
UNION ALL
SELECT 'OfficeOrder', COUNT(*) FROM "OfficeOrder";

-- ২. সিকোয়েন্স সিঙ্ক যাচাই (Next val > Max id)
SELECT setval(pg_get_serial_sequence('"Duty"', 'id'), coalesce(max(id), 1)) FROM "Duty";
SELECT setval(pg_get_serial_sequence('"Employee"', 'id'), coalesce(max(id), 1)) FROM "Employee";
```
