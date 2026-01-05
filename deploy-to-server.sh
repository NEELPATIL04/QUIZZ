#!/bin/bash

#####################################################################
# Quiz Application Deployment Script
# Server: 188.245.121.231
# Repository: https://github.com/NEELPATIL04/QUIZZ.git
#####################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="188.245.121.231"
GITHUB_REPO="https://github.com/NEELPATIL04/QUIZZ.git"
APP_DIR="/var/www/quizz"
APP_USER="quizapp"
DB_NAME="quizdb"
DB_USER="quizuser"
FRONTEND_PORT=3000
BACKEND_PORT=5000

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Quiz App Deployment Script          ║${NC}"
echo -e "${BLUE}║   Server: ${SERVER_IP}            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Function to print step
print_step() {
    echo -e "\n${GREEN}[STEP]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

#####################################################################
# STEP 1: System Update and Basic Setup
#####################################################################
print_step "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

#####################################################################
# STEP 2: Install Required Software
#####################################################################
print_step "Installing required software..."

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install other utilities
sudo apt install -y git curl ufw certbot python3-certbot-nginx

print_success "All software installed"

#####################################################################
# STEP 3: Create Application User
#####################################################################
print_step "Creating application user..."
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    sudo useradd -m -s /bin/bash $APP_USER
    sudo usermod -aG sudo $APP_USER
    print_success "User $APP_USER created"
fi

#####################################################################
# STEP 4: Setup PostgreSQL Database
#####################################################################
print_step "Setting up PostgreSQL database..."

# Generate random password for database
DB_PASSWORD=$(openssl rand -base64 32)

sudo -u postgres psql <<EOF
-- Create database user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Exit
\q
EOF

print_success "Database created: $DB_NAME"
echo -e "${YELLOW}Database Password:${NC} $DB_PASSWORD"
echo -e "${YELLOW}⚠ IMPORTANT: Save this password securely!${NC}\n"

# Save DB password to temp file
echo "$DB_PASSWORD" > /tmp/db_password.txt
chmod 600 /tmp/db_password.txt

#####################################################################
# STEP 5: Clone Repository
#####################################################################
print_step "Cloning repository from GitHub..."

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Clone as app user
sudo -u $APP_USER git clone -b dev $GITHUB_REPO $APP_DIR
print_success "Repository cloned"

#####################################################################
# STEP 6: Setup Backend Environment
#####################################################################
print_step "Configuring backend environment..."

cd $APP_DIR/backend

# Create .env file
sudo -u $APP_USER cat > .env <<EOF
# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Secret (generated)
JWT_SECRET=$(openssl rand -base64 64)

# CORS Origin
CORS_ORIGIN=http://$SERVER_IP:$FRONTEND_PORT,http://$SERVER_IP

# PostgreSQL Direct Connection
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
EOF

print_success "Backend .env configured"

# Install dependencies
print_step "Installing backend dependencies..."
sudo -u $APP_USER npm install
print_success "Backend dependencies installed"

# Run database migrations
print_step "Running database migrations..."
sudo -u $APP_USER npm run db:push
print_success "Database migrated"

# Seed database
print_step "Seeding database..."
sudo -u $APP_USER npm run seed:all-questions
print_success "Database seeded"

# Build backend
print_step "Building backend..."
sudo -u $APP_USER npm run build
print_success "Backend built"

#####################################################################
# STEP 7: Setup Frontend Environment
#####################################################################
print_step "Configuring frontend environment..."

cd $APP_DIR/frontend

# Create .env.local file
sudo -u $APP_USER cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://$SERVER_IP:$BACKEND_PORT
EOF

print_success "Frontend .env configured"

# Install dependencies
print_step "Installing frontend dependencies..."
sudo -u $APP_USER npm install
print_success "Frontend dependencies installed"

# Build frontend
print_step "Building frontend..."
sudo -u $APP_USER npm run build
print_success "Frontend built"

#####################################################################
# STEP 8: Setup PM2 for Process Management
#####################################################################
print_step "Configuring PM2..."

cd $APP_DIR

# Create PM2 ecosystem file
sudo -u $APP_USER cat > ecosystem.config.js <<'EOF'
module.exports = {
  apps: [
    {
      name: 'quiz-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'quiz-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
EOF

# Create logs directory
sudo -u $APP_USER mkdir -p $APP_DIR/logs

# Start applications with PM2
print_step "Starting applications with PM2..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
print_success "PM2 configured and applications started"

#####################################################################
# STEP 9: Configure Nginx
#####################################################################
print_step "Configuring Nginx..."

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/quizz <<EOF
# Backend API Server
upstream backend {
    server localhost:$BACKEND_PORT;
}

# Frontend Server
upstream frontend {
    server localhost:$FRONTEND_PORT;
}

# HTTP Server
server {
    listen 80;
    server_name $SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Client max body size
    client_max_body_size 10M;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/quizz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Nginx configured and started"

#####################################################################
# STEP 10: Configure Firewall (UFW)
#####################################################################
print_step "Configuring firewall..."

sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

print_success "Firewall configured"

#####################################################################
# STEP 11: Setup Automatic Backups
#####################################################################
print_step "Setting up automatic backups..."

# Create backup directory
sudo mkdir -p /var/backups/quizz
sudo chown $APP_USER:$APP_USER /var/backups/quizz

# Create backup script
sudo cat > /usr/local/bin/backup-quizz.sh <<'BACKUP_SCRIPT'
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/quizz"
DB_NAME="quizdb"
DB_USER="quizuser"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory for today
mkdir -p $BACKUP_DIR/$DATE

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$DATE/database_$DATE.sql.gz

# Backup application files
tar -czf $BACKUP_DIR/$DATE/app_$DATE.tar.gz -C /var/www quizz

# Remove old backups
find $BACKUP_DIR -type d -mtime +$RETENTION_DAYS -exec rm -rf {} +

echo "Backup completed: $DATE"
BACKUP_SCRIPT

sudo chmod +x /usr/local/bin/backup-quizz.sh

# Setup cron job for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-quizz.sh >> /var/log/quizz-backup.log 2>&1") | crontab -

print_success "Automatic backups configured (daily at 2 AM)"

#####################################################################
# STEP 12: Setup SSL with Let's Encrypt (if domain provided)
#####################################################################
print_step "SSL Setup..."
print_warning "To enable HTTPS with SSL certificate:"
echo -e "1. Point your domain to this server IP: $SERVER_IP"
echo -e "2. Run: ${YELLOW}sudo certbot --nginx -d yourdomain.com${NC}"
echo -e "3. Follow the prompts to complete SSL setup"

#####################################################################
# STEP 13: Create Admin User
#####################################################################
print_step "Creating admin user..."

cd $APP_DIR/backend
sudo -u $APP_USER npm run seed:admin

print_success "Admin user created (check console output for credentials)"

#####################################################################
# FINAL SUMMARY
#####################################################################
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          DEPLOYMENT COMPLETED SUCCESSFULLY! 🚀             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📊 Application URLs:${NC}"
echo -e "   Frontend: ${YELLOW}http://$SERVER_IP${NC}"
echo -e "   Backend API: ${YELLOW}http://$SERVER_IP/api${NC}"
echo -e "   Admin Dashboard: ${YELLOW}http://$SERVER_IP/dashboard${NC}\n"

echo -e "${BLUE}🗄️  Database Info:${NC}"
echo -e "   Database: ${YELLOW}$DB_NAME${NC}"
echo -e "   User: ${YELLOW}$DB_USER${NC}"
echo -e "   Password: ${YELLOW}$(cat /tmp/db_password.txt)${NC}\n"

echo -e "${BLUE}📁 Application Directory:${NC}"
echo -e "   Location: ${YELLOW}$APP_DIR${NC}\n"

echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   View logs: ${YELLOW}pm2 logs${NC}"
echo -e "   Restart apps: ${YELLOW}pm2 restart all${NC}"
echo -e "   Stop apps: ${YELLOW}pm2 stop all${NC}"
echo -e "   App status: ${YELLOW}pm2 status${NC}"
echo -e "   Nginx status: ${YELLOW}sudo systemctl status nginx${NC}"
echo -e "   View backups: ${YELLOW}ls -lh /var/backups/quizz${NC}\n"

echo -e "${BLUE}🔐 Security:${NC}"
echo -e "   Firewall: ${GREEN}✓ Enabled${NC}"
echo -e "   Ports: ${GREEN}✓ 80, 443, SSH${NC}"
echo -e "   Backups: ${GREEN}✓ Daily at 2 AM${NC}\n"

echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo -e "   1. Save the database password securely"
echo -e "   2. Update DNS to point to $SERVER_IP"
echo -e "   3. Run certbot for SSL: sudo certbot --nginx -d yourdomain.com"
echo -e "   4. Test the application"
echo -e "   5. Delete /tmp/db_password.txt after saving it\n"

# Cleanup
print_step "Cleaning up..."
# Note: Keep /tmp/db_password.txt for user to save manually

print_success "Deployment complete!"
