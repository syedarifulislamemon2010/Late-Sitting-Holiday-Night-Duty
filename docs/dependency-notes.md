# Dependency & Security Audit Notes

Date: 2026-10-25
Node.js: 24.17.0 (.nvmrc) / Target: >=20.9 (package.json)
Next.js: 16.4.3
TypeScript: ~6.0.3

## 1. Resolved Vulnerabilities & Updates
- **zod**: Upgraded to latest 4.x non-breaking release (`^4.6.7`), resolving the High severity memory exhaustion vulnerability (`GHSA-mrhx-c7xc-m3w5`). Validation contracts and schema parsing remain 100% backward compatible.
- **nanoid**: Transitive dependency updated automatically to address High severity loop vulnerability (`GHSA-2v37-7h3g-55p8`).
- **source-map-js**: Transitive dependency updated to patch DoS advisory (`GHSA-68fv-2mgg-jv7q`).
- **brace-expansion**: Transitive dependency updated to patch exponential-time DoS vulnerabilities (`GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895`, `GHSA-q2hr-2g5m-vwhr`).
- **motion**: Unused dependency removed from `package.json` (0 imports across entire codebase).
- **next**: Patched to latest release in the 16.4.x series (`16.4.3`).

## 2. Remaining Audit Findings (6 Moderate Severity)

| Package | Severity | Category | Direct / Transitive | Reachability in Production | Recommended Action |
|---|---|---|---|---|---|
| `uuid` (`<11.1.1`) | Moderate | Transitive (via `exceljs`) | Transitive (`exceljs > uuid`) | **Not Reachable in Production**: In `exceljs`, `uuid` is only invoked internally during OOXML workbook relationship packaging without caller-controlled buffers. | Upgrading requires `exceljs` downgrade to `3.4.0` (breaking change). Keep current `exceljs` as production risk is negligible. |
| `exceljs` (`>=3.5.0`) | Moderate | Production dependency | Direct | Only flagged due to transitive `uuid`. | Retain `exceljs 4.4.0` until upstream publishes patch with `uuid >= 11`. |
| `esbuild` (`<=0.24.2`) | Moderate | Dev dependency | Transitive (`drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils > esbuild`) | **Build/Dev Tooling Only**: Dev-server request vulnerability (`GHSA-67mh-4wv8-2f99`). Not packaged or executed in production Next.js runtime. | Upstream `drizzle-kit` requires major bump to resolve. Safe to keep in devDependencies. |
| `@esbuild-kit/core-utils` | Moderate | Dev dependency | Transitive (`drizzle-kit`) | **Build/Dev Tooling Only**: Not shipped to production. | Dev-only tooling. |
| `@esbuild-kit/esm-loader` | Moderate | Dev dependency | Transitive (`drizzle-kit`) | **Build/Dev Tooling Only**: Not shipped to production. | Dev-only tooling. |
| `drizzle-kit` | Moderate | Dev dependency | Direct | **Build/Dev Tooling Only**: Schema migration CLI tool. Never runs in production web server. | Safe to keep as devDependency. |

## 3. Production High/Critical Audit Status
Running `npm audit --omit=dev --audit-level=high` produces **0 vulnerabilities** (exit code 0).
