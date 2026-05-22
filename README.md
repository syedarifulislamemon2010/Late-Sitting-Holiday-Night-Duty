This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


---

# 🚀 গিটহাব আপ্লোড ও অন্য পিসিতে রান করার সম্পূর্ণ গাইড

---

## পর্ব ১: গিটহাবে আপ্লোড (Push)

### ধাপ ১ — Git ইন্সটল (যদি আগে থেকে না থাকে)

1.  যান: [https://git-scm.com/downloads/win](https://git-scm.com/downloads/win)
2.  **64-bit Git for Windows Setup** ডাউনলোড করুন ও ইন্সটল করুন
3.  ইন্সটলের সময় সব ডিফল্ট সেটিংস রাখুন, শুধু **"Use Git from Git Bash and also from the Windows Command Prompt"** সিলেক্ট আছে কিনা নিশ্চিত করুন
4.  ইন্সটল শেষ হলে PowerShell / Terminal খুলে ভেরিফাই করুন:

```powershell
git --version
```
> আউটপুট: `git version 2.xx.x` দেখলে সফল ✅

---

### ধাপ ২ — GitHub অ্যাকাউন্ট ও রিপোজিটরি তৈরি

1.  ব্রাউজারে যান: [https://github.com](https://github.com)
2.  লগইন করুন (অ্যাকাউন্ট না থাকলে **Sign up** করুন)
3.  উপরে ডানদিকে **"+"** বাটনে ক্লিক করুন → **"New repository"**
4.  ফর্ম পূরণ করুন:
    - **Repository name**: `Admin-Portal` (বা আপনার পছন্দমতো নাম)
    - **Description**: `ডিউটি ম্যানেজমেন্ট ও আপ্যায়ন বিলিং পোর্টাল`
    - **Public** বা **Private** সিলেক্ট করুন (প্রাইভেট রাখতে চাইলে Private দিন)
    - ⚠️ **"Add a README file"** চেক করবেন না (কারণ প্রজেক্টে আগে থেকেই আছে)
    - ⚠️ **".gitignore"** সিলেক্ট করবেন না (আগে থেকেই আছে)
5.  **"Create repository"** ক্লিক করুন
6.  তৈরি হলে একটা URL পাবেন যেমন:
    ```
    https://github.com/YOUR_USERNAME/Admin-Portal.git
    ```
    এই URL টি কপি করে রাখুন 📋

---

### ধাপ ৩ — Git কনফিগারেশন (শুধু প্রথমবার)

PowerShell / Terminal খুলুন এবং নিচের কমান্ডগুলো দিন (আপনার নাম ও ইমেইল দিন):

```powershell
git config --global user.name "আপনার নাম"
git config --global user.email "আপনার_ইমেইল@gmail.com"
```

---

### ধাপ ৪ — প্রজেক্ট ফোল্ডারে Git Initialize ও Push

PowerShell / Terminal খুলুন এবং **একটা একটা করে** নিচের কমান্ডগুলো দিন:

```powershell
# ১. প্রজেক্ট ফোল্ডারে যান
cd "c:\Users\Admin\Downloads\Compressed\Admin-Portal"

# ২. Git রিপোজিটরি ইনিশিয়ালাইজ করুন (আগে থেকে থাকলে স্কিপ হবে)
git init

# ৩. সব ফাইল Stage করুন
git add .

# ৪. প্রথম কমিট করুন
git commit -m "Initial commit: ডিউটি ম্যানেজমেন্ট পোর্টাল"

# ৫. মূল ব্রাঞ্চের নাম main করুন
git branch -M main

# ৬. GitHub রিপোজিটরি যোগ করুন (আপনার URL দিয়ে বদলান)
git remote add origin https://github.com/YOUR_USERNAME/Admin-Portal.git

# ৭. কোড আপ্লোড (Push) করুন
git push -u origin main
```

> [!IMPORTANT]
> ধাপ ৭ এ **GitHub লগইন পপ-আপ** আসতে পারে। ব্রাউজারে লগইন করে অনুমোদন দিন।
> যদি পাসওয়ার্ড চায়, তাহলে GitHub Settings → Developer Settings → **Personal Access Tokens** → **Tokens (classic)** থেকে একটা টোকেন তৈরি করে পাসওয়ার্ডের বদলে সেটা দিন।

---

### ধাপ ৫ — ভেরিফাই করুন

ব্রাউজারে যান: `https://github.com/YOUR_USERNAME/Admin-Portal`

আপনার সব ফাইল দেখা যাচ্ছে? ✅ তাহলে আপ্লোড সফল!

> [!CAUTION]
> `.env` ফাইল `.gitignore` এ আছে তাই এটি **GitHub এ আপ্লোড হবে না** — এটাই সঠিক! `.env` ফাইলে আপনার ডাটাবেজ পাসওয়ার্ড আছে, তাই এটি কখনোই পাবলিকে শেয়ার করবেন না।

---

---

## পর্ব ২: অন্য পিসিতে ডাউনলোড ও রান করা

### প্রয়োজনীয় সফটওয়্যার ইন্সটল করুন

| # | সফটওয়্যার | ডাউনলোড লিংক | কেন দরকার |
|---|---|---|---|
| 1 | **Node.js v22+** (LTS) | [https://nodejs.org](https://nodejs.org) | JavaScript রানটাইম ও npm প্যাকেজ ম্যানেজার |
| 2 | **Git** | [https://git-scm.com](https://git-scm.com) | GitHub থেকে কোড ডাউনলোড করতে |
| 3 | **VS Code** (ঐচ্ছিক) | [https://code.visualstudio.com](https://code.visualstudio.com) | কোড এডিটর |

> [!TIP]
> Node.js ইন্সটল করলে **npm** স্বয়ংক্রিয়ভাবে ইন্সটল হয়ে যায়। আলাদা করে npm ইন্সটল করতে হবে না।

ইন্সটল ভেরিফিকেশন:
```powershell
node --version    # v22.x.x দেখা উচিত
npm --version     # 10.x.x দেখা উচিত
git --version     # 2.x.x দেখা উচিত
```

---

### ধাপ ১ — GitHub থেকে কোড ডাউনলোড (Clone)

```powershell
# যেখানে রাখতে চান সেই ফোল্ডারে যান (যেমন Desktop)
cd Desktop

# Clone করুন
git clone https://github.com/YOUR_USERNAME/Admin-Portal.git

# প্রজেক্ট ফোল্ডারে ঢুকুন
cd Admin-Portal
```

---

### ধাপ ২ — Dependencies ইন্সটল করুন

```powershell
npm install
```

> এটি `package.json` দেখে সব প্রয়োজনীয় লাইব্রেরি (Next.js, React, Prisma, Tailwind, Recharts, Lucide ইত্যাদি) স্বয়ংক্রিয়ভাবে ইন্সটল করবে। ইন্টারনেট কানেকশন দরকার। সময় লাগতে পারে ১-৩ মিনিট।

---

### ধাপ ৩ — `.env` ফাইল তৈরি করুন

> [!IMPORTANT]
> `.env` ফাইল GitHub এ আপ্লোড হয় না (নিরাপত্তার জন্য)। তাই **অন্য পিসিতে ম্যানুয়ালি তৈরি করতে হবে।**

প্রজেক্ট ফোল্ডারের ভেতরে `.env` নামে একটি ফাইল তৈরি করুন:

```powershell
# PowerShell দিয়ে তৈরি করতে:
New-Item -Path ".env" -ItemType File
```

তারপর **Notepad** বা **VS Code** দিয়ে `.env` ফাইলটি ওপেন করে ভেতরে লিখুন:

```env
DATABASE_URL=postgresql://neondb_owner:npg_SwBDg8Gacei1@ep-lively-morning-aoebyciw-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

> এটি আপনার Neon PostgreSQL ক্লাউড ডাটাবেজের কানেকশন URL। একই ডাটাবেজ যেকোনো পিসি থেকে অ্যাক্সেস করা যাবে।

---

### ধাপ ৪ — Prisma Client তৈরি করুন

```powershell
npx prisma generate
```

> এটি `prisma/schema.prisma` পড়ে ডাটাবেজ ক্লায়েন্ট কোড জেনারেট করবে। **প্রতিটি নতুন পিসিতে এটি একবার করতেই হবে।**

---

### ধাপ ৫ — ডেভেলপমেন্ট সার্ভার রান করুন

```powershell
npm run dev
```

> আউটপুটে দেখবেন:
> ```
> ▲ Next.js 16.2.6 (Turbopack)
>    Local: http://localhost:3000
> ```

ব্রাউজার ওপেন করুন: **http://localhost:3000**

লগইন করুন:
- **Username**: `admin`
- **Password**: `123456`

✅ **পোর্টাল রান হচ্ছে!**

---

## 📌 দ্রুত রেফারেন্স কার্ড

### প্রতিদিনের কমান্ড (যখন কোড আপডেট করবেন):

```powershell
# সব পরিবর্তন দেখুন
git status

# সব ফাইল Stage + Commit + Push করুন
git add .
git commit -m "আপডেটের বিবরণ লিখুন"
git push
```

### অন্য পিসিতে লেটেস্ট কোড নামানো (যদি আগে clone করা থাকে):

```powershell
cd Admin-Portal
git pull
npm install      # নতুন কোনো লাইব্রেরি যোগ হলে
npm run dev
```

### প্রোডাকশন বিল্ড (ডিপ্লয়ের আগে):

```powershell
npm run build    # কম্পাইল ও অপ্টিমাইজ
npm run start    # প্রোডাকশন সার্ভার চালু
```

---

## ⚠️ সমস্যা হলে যা করবেন

| সমস্যা | সমাধান |
|---|---|
| `npm install` এ error | `node --version` চেক করুন, v22+ হতে হবে |
| `prisma generate` ফেইল | `npm install` আবার দিন, তারপর আবার চেষ্টা করুন |
| ডাটাবেজ কানেক্ট হচ্ছে না | `.env` ফাইলে `DATABASE_URL` সঠিক আছে কিনা চেক করুন |
| `git push` এ পারমিশন error | GitHub Personal Access Token ব্যবহার করুন |
| পোর্ট 3000 ব্যস্ত | `npm run dev -- -p 3001` দিয়ে অন্য পোর্টে চালান |

