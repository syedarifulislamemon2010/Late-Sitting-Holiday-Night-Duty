# Red Hat Enterprise Linux (RHEL) Production Deployment Guide

This production guide explains the installation, setup, and optimization process for deploying the LHN Portal on **Red Hat Enterprise Linux (RHEL) 8/9**, **Rocky Linux**, or **AlmaLinux** environments.

---

## 📋 Prerequisites & System Update

Before proceeding, connect to your server via SSH with `root` or `sudo` credentials, and perform a full update of your system packages:

```bash
sudo dnf update -y
```

---

## 🗄️ 1. PostgreSQL Installation & Configuration

To set up a local production database server:

### A. Enable and Install PostgreSQL 15+ Module
Enable the PostgreSQL 15 AppStream module and install the packages:
```bash
sudo dnf module enable postgresql:15 -y
sudo dnf install postgresql-server postgresql-contrib -y
```

### B. Initialize the Database Server
Initialize the database instance:
```bash
sudo postgresql-setup --initdb
```

### C. Start and Enable PostgreSQL Service
Enable autostart on system boot and start the daemon:
```bash
sudo systemctl enable postgresql --now
```

### D. Update Authentication Protocol (Required)
RHEL defaults local TCP connections to `ident` authentication, which blocks password-based access. Update `pg_hba.conf` to use `scram-sha-256` or `md5`:
```bash
# Modify client connections to use password-based authentication
sudo sed -i 's/ident/scram-sha-256/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/peer/scram-sha-256/g' /var/lib/pgsql/data/pg_hba.conf
```
Restart PostgreSQL to apply configuration changes:
```bash
sudo systemctl restart postgresql
```

### E. Create User and Database
Access the psql interactive shell:
```bash
sudo -u postgres psql
```
Create database credentials and assign ownership:
```sql
CREATE USER lhn_admin WITH PASSWORD 'SecurePassword123!';
CREATE DATABASE lhn_prod OWNER lhn_admin;
\q
```

---

## 🟢 2. Node.js & 3. Git Installation

Enable the Node.js 20 AppStream module, and install Node.js and Git:

```bash
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs git -y
```
Verify the installation:
```bash
node -v
npm -v
git --version
```

---

## 📂 4. Environment Configuration

### A. Prepare the Directory
Create a dedicated deployment directory and assign ownership to your active user account:
```bash
sudo mkdir -p /var/www/lhn-portal
sudo chown -R $USER:$USER /var/www/lhn-portal
cd /var/www/lhn-portal
```

### B. Clone Code & Install Dependencies
Clone the private repository into the directory and install packages:
```bash
git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git .
npm install
```

### C. Set Up Environment File
Create a `.env` file at the root level of the folder:
```bash
nano .env
```
Add the production configuration:
```env
# Connection details to local PostgreSQL
DATABASE_URL="postgresql://lhn_admin:SecurePassword123!@localhost:5432/lhn_prod"

# Authentication settings
NEXTAUTH_SECRET="GenerateLongCryptographicallySecureRandomSecretHere"
NEXTAUTH_URL="http://your-server-ip"

# Gemini API for OCR features
GEMINI_API_KEY="your-gemini-api-key"

# Supabase configuration for Realtime
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## 🏗️ 5. Drizzle Schema Deployment & Seeding

### A. Push Schema Definitions
Deploy all schemas and database relations into PostgreSQL using Drizzle Kit:
```bash
npx drizzle-kit push
```

### B. Seed Initial Database Data
Populate the database tables with default admin credentials (`admin`/`123456`), standard cells, holidays, and executives:
```bash
npm run db:seed
```
*Note: If `postgres_dump.json` is present in the root folder, the script restores the complete database backup with original IDs and sequence offsets.*

---

## 🏗️ 6. Production Build

Compile the Next.js optimized production bundle:
```bash
npm run build
```

---

## 🔄 7. PM2 Setup & 8. Auto-Start Configuration

PM2 acts as a node process manager ensuring your service restarts automatically upon failure or system reboots.

### A. Install PM2 Globally
```bash
sudo npm install -g pm2
```

### B. Start Application
```bash
pm2 start npm --name "lhn-portal" -- run start -- -p 3000
```

### C. Configure System Boot Integration
Generate and install the Systemd service script:
```bash
pm2 startup systemd
```
*Execute the system script command printed by PM2 in your terminal to complete installation.*

Save the active PM2 process registry:
```bash
pm2 save
```

---

## 🛡️ 9. Nginx Reverse Proxy Setup

Nginx routes public port 80 traffic to internal port 3000 safely.

### A. Install Nginx
```bash
sudo dnf install nginx -y
sudo systemctl enable nginx --now
```

### B. Configure Server Host Block
Create a portal routing file:
```bash
sudo nano /etc/nginx/conf.d/lhn-portal.conf
```
Paste the following reverse proxy directive block:
```nginx
server {
    listen 80;
    server_name localhost; # Replace with Server IP or Domain Name

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Validate syntax correctness and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🧱 10. Firewalld Configuration

Open port 80 and 443 on the active RHEL firewall:
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🛡️ 11. SELinux Configuration (Critical)

By default, SELinux blocks Nginx reverse proxy connections to local loop ports, which causes `502 Bad Gateway` errors. Enable network connectivity for Nginx proxying:
```bash
sudo setsebool -P httpd_can_network_connect 1
```

---

## 🔄 12. Application Update Process

When updating the production code to the latest version, run the following commands in order:

```bash
# 1. Fetch latest commits
git pull origin main

# 2. Update dependencies
npm install

# 3. Synchronize database schemas
npx drizzle-kit push

# 4. Re-compile build artifacts
npm run build

# 5. Restart PM2 process
pm2 restart lhn-portal
```

---

## 🧹 13. Backup & 14. Restore Process

The portal includes integrated scripts to dump and restore the Postgres database records to/from `postgres_dump.json`.

### A. Backup Database (Dump)
Dump the current database schema state and relational records to `postgres_dump.json`:
```bash
npm run db:dump
```

### B. Restore Database (Restore/Seed)
Restore the data from `postgres_dump.json` (performs cascading wipes, restores original primary key IDs, and resets Postgres sequences):
```bash
npm run db:seed
```

---

## 📊 15. Monitoring Commands

Useful commands to manage and monitor the server environment:

* **View application logs:** `pm2 logs lhn-portal`
* **Check process status:** `pm2 status`
* **Nginx error log trace:** `sudo tail -f /var/log/nginx/error.log`
* **Stop application:** `pm2 stop lhn-portal`
* **PostgreSQL service status:** `sudo systemctl status postgresql`
