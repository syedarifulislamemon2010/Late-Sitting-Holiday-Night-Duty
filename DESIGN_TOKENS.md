# 🎨 Janata Bank LHN Portal — Design Tokens Reference

This document serves as the single source of truth for design tokens, typography, colors, components, and layout guidelines across the **Janata Bank LHN Portal**.

---

## 1. Color Tokens

### Primary & Brand Colors (Sovereign Navy & Indigo)
| Token Name | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **`primary-50`** | `#EEF2FF` (`bg-indigo-50`) | `#1E1B4B` (`dark:bg-indigo-950/40`) | Pill backgrounds, subtle card accents |
| **`primary-100`** | `#E0E7FF` (`bg-indigo-100`) | `#312E81` (`dark:bg-indigo-900/40`) | Badges, borders, subtle highlights |
| **`primary-500`** | `#6366F1` (`bg-indigo-500`) | `#818CF8` (`dark:bg-indigo-400`) | Focused input borders, ring highlights |
| **`primary-600`** | `#4F46E5` (`bg-indigo-600`) | `#6366F1` (`dark:bg-indigo-500`) | Primary CTA buttons, active tab indicators |
| **`primary-700`** | `#4338CA` (`bg-indigo-700`) | `#4F46E5` (`dark:bg-indigo-600`) | Primary button hover states |

### Category Specific Duty Colors
| Category | Accent Color | Light Badge Style | Dark Badge Style |
| :--- | :--- | :--- | :--- |
| **`LATE_SITTING`** (লেট সিটিং) | Indigo | `bg-indigo-50 text-indigo-700 border-indigo-200` | `dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800` |
| **`HOLIDAY`** (ছুটির দিন) | Rose / Red | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800` |
| **`NIGHT_SHIFT`** (রাত্রীকালীন ডিউটি) | Amber / Orange | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800` |

### Neutral Surface Colors
| Surface Tier | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Background (Canvas)** | `#F8FAFC` (`bg-slate-50`) | `#090D16` (`dark:bg-slate-950`) | Page background |
| **Card Surface** | `#FFFFFF` (`bg-white`) | `#0F172A` (`dark:bg-slate-900`) | Main containers, modals, cards |
| **Muted Surface** | `#F1F5F9` (`bg-slate-100`) | `#1E293B` (`dark:bg-slate-800`) | Table headers, secondary input backgrounds |
| **Borders** | `#E2E8F0` (`border-slate-200`) | `#334155` (`dark:border-slate-800`) | Card dividers, input borders |

---

## 2. Typography Scale

- **Primary Font Family**: `'SolaimanLipi'`, `'Nikosh'`, `'Inter'`, `sans-serif`
- **Monospace Font Family**: `'Consolas'`, `'Monaco'`, `'Courier New'`, `monospace` (used for Bank IDs, Order References, and Numeric Hashes)

| Scale Level | Tailwind Class | Font Size | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-2xl sm:text-3xl` | 24px – 30px | 1.25 | Auth / Landing titles |
| **Page Title** | `text-xl sm:text-2xl font-extrabold` | 20px – 24px | 1.3 | Top header on pages (`app-page-title`) |
| **Section Title** | `text-base sm:text-lg font-bold` | 16px – 18px | 1.4 | Card headers, panel titles (`app-section-title`) |
| **Body Standard** | `text-sm font-semibold` | 14px | 1.5 | General descriptions, form inputs, table data |
| **Caption / Helper** | `text-xs font-medium` | 12px | 1.4 | Badges, sub-headings, calendar date pills |
| **Micro / Metadata** | `text-[10px] font-bold` | 10px | 1.3 | Timestamps, serial indicators, pill tags |

---

## 3. Elevation & Corner Radii

### Border Radii
- **`rounded-lg` (8px)**: Buttons, small dropdowns, date picker cells
- **`rounded-xl` (12px)**: Input fields, sub-cards, badges, notification toasts
- **`rounded-2xl` (16px)**: Standard content cards, table containers, panel boxes
- **`rounded-3xl` (24px)**: Modal dialogs, floating command palettes
- **`rounded-full`**: Initial avatar badges, status indicators, toggle switches

### Shadow & Elevation
- **Card**: `shadow-xs` / `shadow-sm` with `border border-slate-200/80 dark:border-slate-800/80`
- **Dropdown / Floating Menu**: `shadow-lg border border-slate-200 dark:border-slate-800`
- **Modal / Overlay**: `shadow-2xl ring-1 ring-slate-900/10` with `backdrop-blur-sm`

---

## 4. Accessibility (ARIA) Conventions

1. **Interactive Buttons**: All icon-only buttons (`Printer`, `Trash2`, `Edit`, `X`) MUST have `aria-label="[বাংলায় বাটনের বিবরণ]"` (e.g. `aria-label="অফিস আদেশ প্রিন্ট করুন"`).
2. **Modal Dialogs**: Modals MUST include `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="[id-of-modal-title]"`.
3. **Toggle Controls**: Date selection buttons and tab items MUST declare `aria-pressed="true|false"`.
4. **Form Inputs**: Every input MUST have an explicit `<label>` or `aria-label`.
5. **No Native `window.confirm()`**: Use `<ConfirmDialog />` component for consistent, accessible confirmation modals.
