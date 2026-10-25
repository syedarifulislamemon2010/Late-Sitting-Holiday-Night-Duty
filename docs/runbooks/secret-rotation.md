# Secret Rotation Runbook

## Overview
This runbook documents the procedures for rotating production secrets and credentials in the Janata Bank Late Sitting, Holiday & Night Duty Banking Portal.

## 1. Historical Audit Context: SMS Gateway Credentials
- **Commits of Interest**:
  - `2b887413ec605ad2296959c18e239ee8785a56f9`: Implemented SMS OTP service (`src/lib/sms.ts`).
  - `d1a0ccdab7382a4655799b8f38a9b255ad19627a`: Removed `src/lib/sms.ts` and OTP store.
- **Action Required for SMS Gateway**:
  - The Janata Bank SMS Gateway API keys/passwords present in history should be treated as exposed and rotated immediately at the SMS Gateway Provider / Bank Telecom portal.
- **Git History Cleaning Instructions**:
  > [!WARNING]
  > DO NOT run git-filter-repo directly on active branches without coordinating with all team members, as it rewrites commit SHAs and requires force pushing.
  
  To scrub exposed secrets from Git history on a separate maintenance branch:
  ```bash
  # Step 1: Install git-filter-repo
  pip install git-filter-repo

  # Step 2: Create a backup mirror clone
  git clone --mirror <repo-url> repo-backup.git
  cd repo-backup.git

  # Step 3: Run git-filter-repo with expression or path filtering
  git-filter-repo --path src/lib/sms.ts --invert-paths

  # Step 4: Verify integrity of tests and golden fixtures
  # Step 5: Force push only after full team coordination
  ```

---

## 2. Production Secret Rotation Sequence & Dependencies

When rotating production credentials on RHEL servers running PM2:

### Recommended Rotation Order
1. **`NEXTAUTH_SECRET`**:
   - Generates and signs JWT session tokens.
   - **Generation**: `openssl rand -base64 48`
   - **Impact**: All currently logged-in users will have their sessions invalidated and will be redirected to log in again.
2. **`BACKUP_ENCRYPTION_KEY`**:
   - Used for AES-256-GCM encryption of database backup archives.
   - **Generation**: `openssl rand -hex 32`
   - **Impact**: Old encrypted backup archives require the previous key for decryption. Before rotating, ensure that all critical historical backup archives are either re-encrypted with the new key or the previous key is securely archived in the bank's secret manager/vault.
3. **`CRON_SECRET`**:
   - Secures `/api/backup/cron` endpoint.
   - **Generation**: `openssl rand -hex 32`
   - **Impact**: Must be simultaneously updated in the system crontab / curl invocation script (`curl -H "Authorization: Bearer <NEW_CRON_SECRET>" ...`).
4. **Database Credentials (`DATABASE_URL`)**:
   - Update password in PostgreSQL:
     ```sql
     ALTER USER <db_user> WITH PASSWORD '<new_secure_password>';
     ```
   - Update `DATABASE_URL` in `.env`.

---

## 3. Deployment Procedure on RHEL (PM2)

1. Connect to production server:
   ```bash
   ssh appuser@172.18.18.64
   ```
2. Open environment file with restricted permissions (`chmod 600 .env`):
   ```bash
   nano /path/to/portal/.env
   ```
3. Update the secrets:
   ```ini
   NEXTAUTH_SECRET="<new-secret>"
   BACKUP_ENCRYPTION_KEY="<new-encryption-key>"
   CRON_SECRET="<new-cron-secret>"
   TRUST_PROXY_HEADERS="true"
   ```
4. Reload the PM2 application with zero downtime or graceful restart:
   ```bash
   pm2 reload lhn-portal --update-env
   ```
5. Verify application logs:
   ```bash
   pm2 logs lhn-portal --lines 50
   ```
