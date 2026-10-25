# 🎨 Janata Bank LHN Portal — Design Tokens Reference

This document serves as the single source of truth for design tokens, typography, brand colors, components, and layout guidelines across the **Janata Bank LHN Portal**.

---

## 1. Color Tokens

### Primary & Brand Colors (Janata Bank Sovereign Blue `#0b5e9e` Family)
The visual identity of Janata Bank PLC is anchored around the official corporate cyan-blue (`#0b5e9e`).

| Token Name | Hex Code | Tailwind / CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **`brand-primary`** | `#0b5e9e` | `--primary: #0b5e9e` | Bank header logos, active navigation tabs, primary CTA buttons, document borders |
| **`brand-hover`** | `#074778` | `hover:bg-[#074778]` | Hover state for primary buttons, active links |
| **`brand-dark`** | `#053256` | `bg-[#053256]` | Deep navy gradient stops, emphasized modal headers |
| **`brand-surface`** | `#f0f7fc` | `bg-blue-50 / bg-[#0b5e9e]/10` | Light blue background tints, selection pills, subtle card accents |
| **`brand-border`** | `#0b5e9e` | `border-2 border-[#0b5e9e]` | Official office order divider line, document header dividers |

### Category Specific Duty Colors
| Category | Accent Color | Light Badge Style | Dark Badge Style |
| :--- | :--- | :--- | :--- |
| **`LATE_SITTING`** (লেট সিটিং) | Sky / Indigo | `bg-blue-50 text-[#0b5e9e] border-blue-200` | `dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800` |
| **`HOLIDAY`** (ছুটির দিন) | Rose / Red | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800` |
| **`NIGHT_SHIFT`** (রাত্রীকালীন ডিউটি) | Amber / Orange | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800` |

### Neutral Surface Colors
| Surface Tier | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Background (Canvas)** | `#F8FAFC` (`bg-slate-50`) | `#090D16` (`dark:bg-slate-950`) | Page canvas |
| **Card Surface** | `#FFFFFF` (`bg-white`) | `#0F172A` (`dark:bg-slate-900`) | Main containers, modals, cards |
| **Muted Surface** | `#F1F5F9` (`bg-slate-100`) | `#1E293B` (`dark:bg-slate-800`) | Table headers, secondary input backgrounds |
| **Borders** | `#E2E8F0` (`border-slate-200`) | `#334155` (`dark:border-slate-800`) | Card dividers, input borders |

---

## 2. Typography Scale

- **Primary UI & Document Font Family**: `'SolaimanLipi'`, `'Nikosh'`, `'Noto Sans Bengali'`, `sans-serif`
  - Self-hosted local font fallback configured via `next/font/local` (`Noto Sans Bengali`) and `public/fonts/kalpurush.woff2` for server print templates.
- **Monospace Font Family**: `'Consolas'`, `'Monaco'`, `'Courier New'`, `monospace` (used for Bank IDs, Order References, and Numeric Hashes).

| Scale Level | Tailwind Class | Font Size | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Bank Name Title** | `text-[24px] font-bold` | 24px | 1.0 – 1.15 | Official document header (`জনতা ব্যাংক পিএলসি.`) |
| **Dept / Header** | `text-[18px] font-bold` | 18px | 1.2 | Department name, bill memo main title |
| **Document Order Title**| `text-[14.5px] font-bold` | 14.5px | 1.3 | Office order category title pill (`অফিস আদেশ`) |
| **Standard Body Text** | `text-[12px]` | 12px | 1.6 (Order), 1.1 (Memo) | Canonical print body font, official notification text |
| **Table Data Cells** | `text-[11px]` | 11px | 1.4 | Official roster table cells, duty breakdown grids |

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
