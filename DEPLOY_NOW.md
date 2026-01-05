# Quick Deployment Steps

## 1. Connect to Server

Open PowerShell and run:

```powershell
ssh -i "C:\Users\HP\.ssh\quiz-server.pem" root@188.245.121.231
```

If the key permissions error occurs, run in PowerShell as Administrator:
```powershell
icacls "C:\Users\HP\.ssh\quiz-server.pem" /inheritance:r
icacls "C:\Users\HP\.ssh\quiz-server.pem" /grant:r "%username%:R"
```

## 2. Upload Deployment Script

From Windows PowerShell (before SSH):

```powershell
scp -i "C:\Users\HP\.ssh\quiz-server.pem" "C:\Users\HP\Documents\quizz\deploy-to-server.sh" root@188.245.121.231:/root/
```

## 3. Run Deployment (After SSH into server)

```bash
# Make script executable
chmod +x /root/deploy-to-server.sh

# Run deployment
/root/deploy-to-server.sh
```

⏱️ **Wait 10-15 minutes** for deployment to complete.

## 4. Save Important Info

After deployment completes:

```bash
# Save database password
cat /tmp/db_password.txt
```

**IMPORTANT**: Copy and save this password securely, then delete the file:
```bash
rm /tmp/db_password.txt
```

## 5. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check Nginx
sudo systemctl status nginx
```

## 6. Access Application

Open browser:
- **Frontend**: http://188.245.121.231
- **Backend API**: http://188.245.121.231/api
- **Admin Dashboard**: http://188.245.121.231/dashboard

## 7. Optional: Setup SSL (if you have a domain)

1. Point your domain DNS A record to: 188.245.121.231
2. Wait 5-10 minutes for DNS propagation
3. Run on server:
```bash
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### If deployment fails:

```bash
# Check logs
pm2 logs

# Check PostgreSQL
sudo systemctl status postgresql

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Restart all
pm2 restart all
sudo systemctl restart nginx
```

### If can't connect via SSH:

Try with verbose mode to see the error:
```powershell
ssh -v -i "C:\Users\HP\.ssh\quiz-server.pem" root@188.245.121.231
```

## Post-Deployment

After successful deployment:

1. ✅ Test all 7 questions (5 challenges + 2 bid rounds)
2. ✅ Test Challenge #5 drag-and-drop functionality
3. ✅ Verify undo/redo/reset buttons work
4. ✅ Test partial marking system
5. ✅ Create admin account and test teams

## Useful Commands

```bash
# View all logs
pm2 logs

# Restart apps
pm2 restart all

# Stop apps
pm2 stop all

# Database backup
/usr/local/bin/backup-quizz.sh

# Update application
cd /var/www/quizz
git pull origin dev
npm install
npm run build
pm2 restart all
```
