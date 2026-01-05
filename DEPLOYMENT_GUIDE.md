# 🚀 Quiz Application Deployment Guide

Complete guide to deploy the Quiz Application to production server.

---

## 📋 Prerequisites

- **Server IP**: `188.245.121.231`
- **SSH Private Key**: Your private key file (e.g., `quiz-server.pem`)
- **Domain** (optional): For SSL/HTTPS setup
- **GitHub Repo**: https://github.com/NEELPATIL04/QUIZZ.git

---

## 🔑 STEP 1: Connect to Server via SSH

### Windows (PowerShell):

```powershell
# Replace PATH_TO_YOUR_KEY with your actual key path
ssh -i "C:\Users\HP\.ssh\quiz-server.pem" root@188.245.121.231
```

### Alternative - Using PuTTY:
1. Open PuTTY
2. Host: `188.245.121.231`
3. Connection → SSH → Auth → Browse for private key
4. Click "Open"

---

## 📥 STEP 2: Upload Deployment Script

### Method 1: Using SCP (from Windows):

```powershell
scp -i "PATH_TO_YOUR_KEY" C:\Users\HP\Documents\quizz\deploy-to-server.sh root@188.245.121.231:/root/
```

### Method 2: Copy-Paste (if SCP doesn't work):

1. SSH into server
2. Run: `nano deploy-to-server.sh`
3. Copy content from `deploy-to-server.sh` file
4. Paste into nano
5. Press `Ctrl+X`, then `Y`, then `Enter`

---

## ⚙️ STEP 3: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-to-server.sh

# Run deployment
./deploy-to-server.sh
```

**⏱️ Deployment Time**: Approximately 10-15 minutes

---

## 🔐 STEP 4: Setup SSL/HTTPS (Optional but Recommended)

### If you have a domain:

1. **Point Domain to Server**:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add an A record: `quiz.yourdomain.com` → `188.245.121.231`
   - Wait 5-10 minutes for DNS propagation

2. **Install SSL Certificate**:
   ```bash
   sudo certbot --nginx -d quiz.yourdomain.com
   ```

3. **Follow Certbot Prompts**:
   - Enter email address
   - Agree to terms
   - Choose redirect HTTP to HTTPS: Yes

### If using IP only:

The app will run on HTTP:
- Frontend: `http://188.245.121.231`
- Backend: `http://188.245.121.231/api`

---

## 📊 STEP 5: Verify Deployment

### Check Application Status:

```bash
# View PM2 processes
pm2 status

# View logs
pm2 logs

# Check Nginx
sudo systemctl status nginx

# Test backend API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000
```

### Expected Output:
```
┌─────┬──────────────────┬─────────┬─────────┐
│ id  │ name             │ status  │ cpu     │
├─────┼──────────────────┼─────────┼─────────┤
│ 0   │ quiz-backend     │ online  │ 0.5%    │
│ 1   │ quiz-frontend    │ online  │ 1.2%    │
└─────┴──────────────────┴─────────┴─────────┘
```

---

## 🧪 STEP 6: Test the Application

### 1. Open Browser:
```
http://188.245.121.231
```

### 2. Login as Admin:
- Username: `admin`
- Password: (check terminal output after deployment)

### 3. Test Features:
- ✅ Create teams
- ✅ Enable questions
- ✅ Start quiz as team
- ✅ Test all 5 challenges + 2 bid rounds

---

## 🔧 Post-Deployment Configuration

### Update Environment Variables:

```bash
# Backend
nano /var/www/quizz/backend/.env

# Frontend
nano /var/www/quizz/frontend/.env.local

# After changes, restart apps
pm2 restart all
```

### Common Settings to Update:

**Backend `.env`**:
```env
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<your-secret>
```

**Frontend `.env.local`**:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## 📁 Important File Locations

| Item | Location |
|------|----------|
| Application | `/var/www/quizz` |
| Backend | `/var/www/quizz/backend` |
| Frontend | `/var/www/quizz/frontend` |
| Nginx Config | `/etc/nginx/sites-available/quizz` |
| PM2 Config | `/var/www/quizz/ecosystem.config.js` |
| Logs | `/var/www/quizz/logs` |
| Backups | `/var/backups/quizz` |
| DB Password | `/tmp/db_password.txt` (delete after saving!) |

---

## 🛠️ Useful Commands

### PM2 Commands:
```bash
pm2 status              # View process status
pm2 logs                # View all logs
pm2 logs quiz-backend   # View backend logs only
pm2 logs quiz-frontend  # View frontend logs only
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 start all           # Start all apps
pm2 delete all          # Delete all processes
pm2 save                # Save current process list
```

### Nginx Commands:
```bash
sudo systemctl status nginx    # Check Nginx status
sudo systemctl restart nginx   # Restart Nginx
sudo systemctl stop nginx      # Stop Nginx
sudo systemctl start nginx     # Start Nginx
sudo nginx -t                  # Test configuration
```

### Database Commands:
```bash
# Connect to database
sudo -u postgres psql -d quizdb

# Backup database manually
pg_dump -U quizuser quizdb > backup.sql

# Restore database
psql -U quizuser quizdb < backup.sql

# View all databases
sudo -u postgres psql -l
```

### View Logs:
```bash
# PM2 logs
pm2 logs

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 🔄 Update Application

### Method 1: Git Pull (Recommended)

```bash
cd /var/www/quizz

# Pull latest changes
git pull origin dev

# Backend updates
cd backend
npm install
npm run build
npm run db:push

# Frontend updates
cd ../frontend
npm install
npm run build

# Restart applications
pm2 restart all
```

### Method 2: Fresh Deployment

```bash
# Backup current database
pg_dump -U quizuser quizdb > /tmp/backup_$(date +%Y%m%d).sql

# Remove old app
rm -rf /var/www/quizz

# Re-run deployment script
./deploy-to-server.sh
```

---

## 🔐 Security Checklist

- ✅ Firewall enabled (UFW)
- ✅ Only ports 80, 443, 22 open
- ✅ Strong database password
- ✅ JWT secret configured
- ✅ SSL/HTTPS enabled (if domain)
- ✅ Regular backups (daily at 2 AM)
- ✅ Non-root user created
- ✅ Latest security updates installed

---

## 📦 Backup & Restore

### Automatic Backups:
- **Schedule**: Daily at 2:00 AM
- **Location**: `/var/backups/quizz`
- **Retention**: 7 days
- **Contents**: Database + Application files

### Manual Backup:
```bash
# Run backup script manually
/usr/local/bin/backup-quizz.sh

# List backups
ls -lh /var/backups/quizz
```

### Restore from Backup:
```bash
# Find backup
ls /var/backups/quizz

# Restore database
cd /var/backups/quizz/YYYYMMDD_HHMMSS
gunzip database_*.sql.gz
psql -U quizuser quizdb < database_*.sql

# Restore application files
tar -xzf app_*.tar.gz -C /var/www

# Restart
pm2 restart all
```

---

## 🐛 Troubleshooting

### Problem: Applications won't start

```bash
# Check PM2 logs
pm2 logs

# Check if ports are already in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000

# Kill processes if needed
sudo kill -9 $(lsof -t -i:3000)
sudo kill -9 $(lsof -t -i:5000)

# Restart
pm2 restart all
```

### Problem: Database connection error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Check connection
psql -U quizuser -d quizdb -h localhost

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Problem: Nginx error

```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: Can't access from browser

```bash
# Check firewall
sudo ufw status

# Check if apps are running
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test locally
curl http://localhost:3000
curl http://localhost:5000/api/health
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks:

**Daily**:
- ✅ Automatic backups run at 2 AM

**Weekly**:
- Check disk space: `df -h`
- Check logs: `pm2 logs`
- Review Nginx logs

**Monthly**:
- Update system: `sudo apt update && sudo apt upgrade`
- Review backups: `ls -lh /var/backups/quizz`
- Test backup restoration

### Monitoring:

```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -m

# Application stats
pm2 monit
```

---

## 🎉 Deployment Complete!

Your quiz application is now running on:

**🌐 Frontend**: `http://188.245.121.231`
**🔌 Backend API**: `http://188.245.121.231/api`
**👨‍💼 Admin Panel**: `http://188.245.121.231/dashboard`

### Next Steps:

1. **Save Database Password** from `/tmp/db_password.txt`
2. **Delete** `/tmp/db_password.txt` after saving
3. **Setup Domain & SSL** (if applicable)
4. **Test All Features**
5. **Create Admin Account**
6. **Create Test Teams**

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
- [Let's Encrypt](https://letsencrypt.org)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

**🎓 Happy Quizzing!**
