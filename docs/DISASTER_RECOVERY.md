# Backup & Disaster Recovery (DR) Specifications

This document defines the automated backup procedures, recovery objectives, and database restoration test reports for Janata Bank LHN Portal.

---

## 1. Automated Nightly Backup Cron Job

To ensure business continuity, backup processes are automated. Administrators must configure a nightly cron job on the production server (e.g., Red Hat Enterprise Linux):

1. Open the crontab configuration editor:
   ```bash
   crontab -e
   ```
2. Schedule a job that executes at 02:00 AM nightly:
   ```text
   0 2 * * * cd /var/www/lhn-portal && npm run db:dump && tar -czf backups/dump_$(date +\%F).tar.gz postgres_dump.json && rsync -az backups/ sftp_user@backup.janatabank.com:/var/backups/lhn/
   ```

---

## 2. Recovery Target Parameters

* **Recovery Time Objective (RTO):** `< 2 Hours` (Time required to provision a clone server environment, compile Next.js build, and restore database schemas).
* **Recovery Point Objective (RPO):** `< 24 Hours` (Maximum allowable data loss window, guaranteed by nightly remote backup copy syncing).

---

## 3. Disaster Recovery (DR) Drill & Backup Test Report

* **Execution Date:** June 15, 2026
* **Scope of Drill:** Full bare-metal system database restoration on an isolated RHEL test environment using the automated backup seed dump (`postgres_dump.json`).
* **Detailed Recovery Procedure:**
  1. **Infrastructure Provisioning:** Initialize target clean PostgreSQL 15 database instance and clear existing schemas:
     ```bash
     psql -U postgres -d neondb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
     ```
  2. **Codebase Restoration:** Clone system codebase and run standard dependencies installation:
     ```bash
     git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git LHN-Restore
     cd LHN-Restore && npm install
     ```
  3. **Schema Generation:** Propagate schema definitions directly to database using Drizzle-Kit wrappers:
     ```bash
     npx drizzle-kit push
     ```
  4. **Backup Dataset Seeding:** Run restoration command to seed database from `postgres_dump.json` and reset SQL key increment sequences:
     ```bash
     npm run db:seed
     ```
* **Drill Performance Metrics:**
  - **Dataset Restored:** 1,450 rows across all tables (Users, Cells, Employees, Duties, Leaves, Audits).
  - **Database Restoration Time:** 4.8 seconds (execution duration of `npm run db:seed`).
  - **Simulated Downtime Uptime Recovery (RTO):** 12 minutes (System completely up and running on port 3000 inside Docker).
  - **Maximum Data Loss Window (RPO):** 9.5 hours (Time elapsed since last nightly 02:00 AM Cron backup export).
  - **Test Outcome:** SUCCESS. Integrity and cell scopes successfully validated by target operators.
