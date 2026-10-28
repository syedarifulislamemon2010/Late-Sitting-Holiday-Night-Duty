# RBAC Observed Behavior: Current Official Route Authorization Matrix
**তারিখ (Generated Date):** ২৮ অক্টোবর, ২০২৬  
**উৎস (Baseline Source):** কোডবেসের প্রতিটি রুট এবং সার্ভিস লেয়ারের বর্তমান অথরাইজেশন চেক (`requireAuth`, `requireAdmin`, `currentUser.role`, ও সেল ওনারশিপ ফিল্টার)।  
**উদ্দেশ্য:** সমস্ত unmapped API রুটের বর্তমান কার্যকর অফিশিয়াল আচরণ লিপিবদ্ধ করা এবং `src/permissions/rbac.ts` ও `src/lib/rbac-audit.ts`-এ audit-only কভারেজ সম্প্রসারণ করা।

---

## ১. সারসংক্ষেপ (Overview)
- **মোট API হ্যান্ডলার:** ৭৬টি
- **সিস্টেম/পাবলিক এক্সেম্পট রুট:** ৩টি (`/api/ping`, `/api/health`, `/api/auth/[...nextauth]` এবং স্পেশাল হেডার টোকেন সুরক্ষিত `/api/backup/cron`)
- **পূর্বে ম্যাপড রুট:** ১৫টি
- **বর্তমান অডিটে অন্তর্ভুক্ত আন-ম্যাপড রুট:** ৫৮টি হ্যান্ডলার (৫৬টি স্বতন্ত্র `METHOD ROUTE` কী)
- **বর্তমান অডিট কভারেজ:** ১০০% (সমস্ত রুট অডিট ট্র্যাকিংয়ের আওতায়)

---

## ২. বর্তমান অফিশিয়াল আচরণ ম্যাট্রিক্স (Observed Behavior Matrix)

| ক্রম | Method | Canonical Route | ফাইল ও লাইন | রুটের বর্তমান নিজস্ব চেক | অনুমোদিত রোল (Observed Allowed) | PermissionAction |
|---|---|---|---|---|---|---|
| ১ | `GET` | `/api/analytics` | `src/app/api/analytics/route.ts:13` | সেশন আবশ্যক; EMPLOYEE শুধুমাত্র নিজস্ব সেল/পোর্টাল ডেটা পায়, USER নিজ সেলে সীমাবদ্ধ, ADMIN পূর্ণ ডেটা পায় | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_ANALYTICS` |
| ২ | `GET` | `/api/audit` | `src/app/api/audit/route.ts:8` | `currentUser.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `VIEW_AUDIT` |
| ৩ | `GET` | `/api/backup` | `src/app/api/backup/route.ts:83` | `!currentUser || currentUser.role !== 'ADMIN'` হলে ৪০১/৪০৩ | `ADMIN` | `VIEW_BACKUP` |
| ৪ | `POST` | `/api/backup` | `src/app/api/backup/route.ts:182` | `!currentUser || currentUser.role !== 'ADMIN'` হলে ৪০১/৪০৩ | `ADMIN` | `MANAGE_BACKUP` |
| ৫ | `GET` | `/api/cells` | `src/app/api/cells/route.ts:14` | সেশন আবশ্যক; USER নিজ সেলে ফিল্টারড তালিকা পায়, ADMIN সব সেল দেখে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_CELLS` |
| ৬ | `POST` | `/api/cells` | `src/app/api/cells/route.ts:70` | `currentUser.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `MANAGE_CELLS` |
| ৭ | `PUT` | `/api/cells` | `src/app/api/cells/[id]/route.ts:10` | `currentUser.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `MANAGE_CELLS` |
| ৮ | `DELETE` | `/api/cells` | `src/app/api/cells/[id]/route.ts:66` | `currentUser.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `MANAGE_CELLS` |
| ৯ | `POST` | `/api/documents/generate-bill-memo` | `src/app/api/documents/generate-bill-memo/route.ts:45` | সেশন থাকলে অডিট লগ হয়; অর্ডার স্ট্যাটাস 'Generated & Printed' এ ট্রানজিশন হয় | `ADMIN`, `USER` | `GENERATE_DOCUMENTS` |
| ১০ | `POST` | `/api/documents/generate-closing-bill` | `src/app/api/documents/generate-closing-bill/route.ts:87` | সেশন আবশ্যক; ক্লোজিং বিল এইচটিএমএল জেনারেট করে | `ADMIN`, `USER` | `GENERATE_DOCUMENTS` |
| ১১ | `POST` | `/api/documents/generate-employee-list` | `src/app/api/documents/generate-employee-list/route.ts:31` | সেশন আবশ্যক; নন-অ্যাডমিনের ক্ষেত্রে সেল ফিল্টার চেক হয় | `ADMIN`, `USER` | `GENERATE_DOCUMENTS` |
| ১২ | `POST` | `/api/documents/generate-lunch-bill` | `src/app/api/documents/generate-lunch-bill/route.ts:128` | সেশন আবশ্যক; লাঞ্চ বিল প্রিন্ট এইচটিএমএল জেনারেট করে | `ADMIN`, `USER` | `GENERATE_DOCUMENTS` |
| ১৩ | `POST` | `/api/documents/generate-office-order` | `src/app/api/documents/generate-office-order/route.ts:40` | অফিস আদেশ এইচটিএমএল জেনারেট করে | `ADMIN`, `USER` | `GENERATE_DOCUMENTS` |
| ১৪ | `GET` | `/api/documents` | `src/app/api/documents/route.ts:12` | `!user || user.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `VIEW_DOCUMENTS` |
| ১৫ | `DELETE` | `/api/documents` | `src/app/api/documents/route.ts:28` | `!user || user.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `DELETE_DOCUMENTS` |
| ১৬ | `GET` | `/api/duties` | `src/app/api/duties/route.ts:9` | `DutyService.listDuties`: সেশন আবশ্যক; নন-অ্যাডমিন সেল রেস্ট্রিক্টেড | `ADMIN`, `USER` | `VIEW_DUTIES` |
| ১৭ | `GET` | `/api/employees` | `src/app/api/employees/route.ts:11` | `EmployeeService.listEmployees`: সেশন আবশ্যক; ডিরেক্টরি বা সেল অনুযায়ী তালিকা | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_EMPLOYEES` |
| ১৮ | `GET` | `/api/executives` | `src/app/api/executives/route.ts:10` | `ExecutiveService.listExecutives`: সেশন আবশ্যক | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_EXECUTIVES` |
| ১৯ | `POST` | `/api/executives` | `src/app/api/executives/route.ts:21` | `ExecutiveService.createExecutive`: `role !== 'ADMIN'` হলে ৪০৩ | `ADMIN` | `MANAGE_EXECUTIVES` |
| ২০ | `PUT` | `/api/executives` | `src/app/api/executives/[id]/route.ts:8` | `ExecutiveService.updateExecutive`: `role !== 'ADMIN'` হলে ৪০৩ | `ADMIN` | `MANAGE_EXECUTIVES` |
| ২১ | `DELETE` | `/api/executives` | `src/app/api/executives/[id]/route.ts:42` | `ExecutiveService.deleteExecutive`: `role !== 'ADMIN'` হলে ৪০৩ | `ADMIN` | `MANAGE_EXECUTIVES` |
| ২২ | `GET` | `/api/hardware-requisitions` | `src/app/api/hardware-requisitions/route.ts:14` | সেশন আবশ্যক; নন-অ্যাডমিন কেবল নিজস্ব রিকুইজিশন দেখতে পায় | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_HARDWARE_REQUISITIONS` |
| ২৩ | `POST` | `/api/hardware-requisitions` | `src/app/api/hardware-requisitions/route.ts:59` | সেশন আবশ্যক; কর্মকর্তা হার্ডওয়্যার রিকুইজিশন তৈরি করতে পারেন | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_HARDWARE_REQUISITIONS` |
| ২৪ | `GET` | `/api/hardware-requisitions` (by id) | `src/app/api/hardware-requisitions/[id]/route.ts:10` | সেশন আবশ্যক; `user.role !== 'ADMIN' && requesterUserId !== user.id` হলে ৪০৩ | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_HARDWARE_REQUISITIONS` |
| ২৫ | `DELETE` | `/api/hardware-requisitions` | `src/app/api/hardware-requisitions/[id]/route.ts:56` | সেশন আবশ্যক; `user.role !== 'ADMIN' && requesterUserId !== user.id` হলে ৪০৩ | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_HARDWARE_REQUISITIONS` |
| ২৬ | `GET` | `/api/holidays` | `src/app/api/holidays/route.ts:14` | সেশন আবশ্যক; ছুটির ক্যালেন্ডার তালিকা রিটার্ন করে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_HOLIDAYS` |
| ২৭ | `POST` | `/api/holidays` | `src/app/api/holidays/route.ts:49` | `!user || user.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `MANAGE_HOLIDAYS` |
| ২৮ | `DELETE` | `/api/holidays` | `src/app/api/holidays/route.ts:106` | `!user || user.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `MANAGE_HOLIDAYS` |
| ২৯ | `GET` | `/api/leaves/balance` | `src/app/api/leaves/balance/route.ts:9` | সেশন আবশ্যক; ছুটির ব্যালেন্স রিটার্ন করে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_LEAVES` |
| ৩০ | `POST` | `/api/leaves/log-resolve-failed` | `src/app/api/leaves/log-resolve-failed/route.ts:8` | সেশন আবশ্যক; ব্যর্থ এআই কনফ্লিক্ট রেজোলিউশন লগ করে | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_LEAVES` |
| ৩১ | `GET` | `/api/leaves` | `src/app/api/leaves/route.ts:12` | `LeaveService.listLeaves`: সেশন আবশ্যক; নন-অ্যাডমিন কেবল নিজস্ব ছুটি দেখে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_LEAVES` |
| ৩২ | `POST` | `/api/leaves` | `src/app/api/leaves/route.ts:27` | `LeaveService.createLeave`: সেশন আবশ্যক; যে কেউ আবেদন করতে পারে (সেল ভ্যালিডেশন সহ) | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_LEAVES` |
| ৩৩ | `PUT` | `/api/leaves` | `src/app/api/leaves/[id]/route.ts:12` | `LeaveService.updateLeave`: অ্যাডমিন অথবা নিজ ছুটির মালিক | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_LEAVES` |
| ৩৪ | `DELETE` | `/api/leaves` | `src/app/api/leaves/[id]/route.ts:99` | `LeaveService.deleteLeave`: অ্যাডমিন অথবা নিজ ছুটির মালিক | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_LEAVES` |
| ৩৫ | `GET` | `/api/lunch-bills/leave-days` | `src/app/api/lunch-bills/leave-days/route.ts:7` | সেশন আবশ্যক; মাসের ছুটির দিনের অনুপস্থিতি গণনা করে | `ADMIN`, `USER` | `VIEW_LUNCH_BILLS` |
| ৩৬ | `GET` | `/api/lunch-bills` | `src/app/api/lunch-bills/route.ts:36` | সেশন আবশ্যক; নন-অ্যাডমিন অনুমোদিত সেলে সীমাবদ্ধ | `ADMIN`, `USER` | `VIEW_LUNCH_BILLS` |
| ৩৭ | `POST` | `/api/lunch-bills` | `src/app/api/lunch-bills/route.ts:142` | সেশন আবশ্যক; নন-অ্যাডমিনের সেল না থাকলে ৪০৩ ফরবিডেন | `ADMIN`, `USER` | `MANAGE_LUNCH_BILLS` |
| ৩৮ | `GET` | `/api/manual-documents/raw` | `src/app/api/manual-documents/raw/route.ts:11` | সেশন আবশ্যক; `user.role === 'USER' && !doc.isVisibleToUsers` হলে ৪০৩ | `ADMIN`, `USER` | `VIEW_MANUAL_DOCUMENTS` |
| ৩৯ | `GET` | `/api/manual-documents` | `src/app/api/manual-documents/route.ts:14` | সেশন আবশ্যক; USER নিজ আপলোড বা দৃশ্যমান ডকুমেন্ট দেখে | `ADMIN`, `USER` | `VIEW_MANUAL_DOCUMENTS` |
| ৪০ | `POST` | `/api/manual-documents` | `src/app/api/manual-documents/route.ts:44` | সেশন আবশ্যক; ফাইল আপলোড করা যায় | `ADMIN`, `USER` | `MANAGE_MANUAL_DOCUMENTS` |
| ৪১ | `PUT` | `/api/manual-documents` | `src/app/api/manual-documents/route.ts:127` | সেশন আবশ্যক; `user.role !== 'ADMIN' && doc.uploadedBy !== user.username` হলে ৪০৩ | `ADMIN`, `USER` | `MANAGE_MANUAL_DOCUMENTS` |
| ৪২ | `DELETE` | `/api/manual-documents` | `src/app/api/manual-documents/route.ts:206` | সেশন আবশ্যক; `user.role !== 'ADMIN' && doc.uploadedBy !== user.username` হলে ৪০৩ | `ADMIN`, `USER` | `MANAGE_MANUAL_DOCUMENTS` |
| ৪৩ | `GET` | `/api/my-portal` | `src/app/api/my-portal/route.ts:15` | সেশন আবশ্যক; কর্মকর্তা নিজস্ব পোর্টাল ড্যাশবোর্ড ডেটা পায় | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_MY_PORTAL` |
| ৪৪ | `GET` | `/api/notifications` | `src/app/api/notifications/route.ts:20` | সেশন আবশ্যক; ইউজারের নোটিফিকেশন রিটার্ন করে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_NOTIFICATIONS` |
| ৪৫ | `GET` | `/api/office-orders/next-ref` | `src/app/api/office-orders/next-ref/route.ts:8` | সেশন আবশ্যক; পরবর্তী স্মারক নম্বর গণনা করে | `ADMIN`, `USER` | `VIEW_OFFICE_ORDERS` |
| ৪৬ | `GET` | `/api/office-orders/raw` | `src/app/api/office-orders/raw/route.ts:53` | সেশন আবশ্যক; কাঁচা এইচটিএমএল রিটার্ন করে | `ADMIN`, `USER` | `VIEW_OFFICE_ORDERS` |
| ৪৭ | `GET` | `/api/office-orders` | `src/app/api/office-orders/route.ts:8` | `OfficeOrderService.listOfficeOrders`: সেশন আবশ্যক; নন-অ্যাডমিন সেল রেস্ট্রিক্টেড | `ADMIN`, `USER` | `VIEW_OFFICE_ORDERS` |
| ৪৮ | `GET` | `/api/profile` | `src/app/api/profile/route.ts:11` | সেশন আবশ্যক; লগইনকৃত ইউজারের নিজস্ব প্রোফাইল | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_PROFILE` |
| ৪৯ | `PUT` | `/api/profile` | `src/app/api/profile/route.ts:32` | সেশন আবশ্যক; লগইনকৃত ইউজার প্রোফাইল তথ্য আপডেট করতে পারে | `ADMIN`, `USER`, `EMPLOYEE` | `UPDATE_PROFILE` |
| ৫০ | `GET` | `/api/search` | `src/app/api/search/route.ts:9` | সেশন আবশ্যক; ইউজারদের ক্ষেত্রে সেল স্কোপড সার্চ হয় | `ADMIN`, `USER`, `EMPLOYEE` | `SEARCH_RECORDS` |
| ৫১ | `GET` | `/api/taz-committee-forms` | `src/app/api/taz-committee-forms/route.ts:14` | সেশন আবশ্যক; নন-অ্যাডমিন নিজ TAZ ফরম দেখে | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_TAZ_COMMITTEE_FORMS` |
| ৫২ | `POST` | `/api/taz-committee-forms` | `src/app/api/taz-committee-forms/route.ts:57` | সেশন আবশ্যক; কর্মকর্তা TAZ ফরম সাবমিট করতে পারে | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_TAZ_COMMITTEE_FORMS` |
| ৫৩ | `GET` | `/api/taz-committee-forms` (by id) | `src/app/api/taz-committee-forms/[id]/route.ts:12` | সেশন আবশ্যক; `user.role !== 'ADMIN' && form.requesterUserId !== user.id` হলে ৪০৩ | `ADMIN`, `USER`, `EMPLOYEE` | `VIEW_TAZ_COMMITTEE_FORMS` |
| ৫৪ | `PUT` | `/api/taz-committee-forms` | `src/app/api/taz-committee-forms/[id]/route.ts:57` | সেশন আবশ্যক; `user.role !== 'ADMIN' && requesterUserId !== user.id` হলে ৪০৩ | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_TAZ_COMMITTEE_FORMS` |
| ৫৫ | `DELETE` | `/api/taz-committee-forms` | `src/app/api/taz-committee-forms/[id]/route.ts:179` | সেশন আবশ্যক; `user.role !== 'ADMIN' && requesterUserId !== user.id` হলে ৪০৩ | `ADMIN`, `USER`, `EMPLOYEE` | `MANAGE_TAZ_COMMITTEE_FORMS` |
| ৫৬ | `GET` | `/api/trash` | `src/app/api/trash/route.ts:13` | সেশন আবশ্যক; নন-অ্যাডমিন নিজ ডিলিটকৃত আইটেম দেখে | `ADMIN`, `USER` | `VIEW_TRASH` |
| ৫৭ | `POST` | `/api/trash` | `src/app/api/trash/route.ts:38` | clean-expired শুধুমাত্র ADMIN; restore ও delete-permanently নিজ আইটেম অথবা ADMIN | `ADMIN`, `USER` | `MANAGE_TRASH` |
| ৫৮ | `GET` | `/api/users` | `src/app/api/users/route.ts:13` | `currentUser.role !== 'ADMIN'` হলে ৪০৩ ফরবিডেন | `ADMIN` | `VIEW_USERS` |

---

## ৩. পূর্বে বিদ্যমান ১৫টি ম্যাপড রুট (Existing Mapped Baseline)

| Method | Canonical Route | অনুমোদিত রোল (Allowed Roles) | PermissionAction |
|---|---|---|---|
| `POST` | `/api/employees` | `ADMIN` | `CREATE_EMPLOYEE` |
| `POST` | `/api/employees/parse-image` | `ADMIN` | `CREATE_EMPLOYEE` |
| `PUT` | `/api/employees` | `ADMIN`, `USER` | `UPDATE_EMPLOYEE` |
| `DELETE` | `/api/employees` | `ADMIN` | `DELETE_EMPLOYEE` |
| `POST` | `/api/duties` | `ADMIN`, `USER` | `CREATE_DUTY` |
| `POST` | `/api/duties/check-conflicts` | `ADMIN`, `USER` | `CREATE_DUTY` |
| `POST` | `/api/duties/parse-roster-image` | `ADMIN`, `USER` | `CREATE_DUTY` |
| `PUT` | `/api/duties` | `ADMIN`, `USER` | `UPDATE_DUTY` |
| `DELETE` | `/api/duties` | `ADMIN` | `DELETE_DUTY` |
| `POST` | `/api/office-orders` | `ADMIN`, `USER` | `CREATE_OFFICE_ORDER` |
| `PUT` | `/api/office-orders` | `ADMIN`, `USER` | `UPDATE_OFFICE_ORDER` |
| `DELETE` | `/api/office-orders` | `ADMIN` | `DELETE_OFFICE_ORDER` |
| `POST` | `/api/users` | `ADMIN` | `MANAGE_USERS` |
| `PUT` | `/api/users` | `ADMIN` | `MANAGE_USERS` |
| `DELETE` | `/api/users` | `ADMIN` | `MANAGE_USERS` |
