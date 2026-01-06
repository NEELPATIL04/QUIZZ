#!/bin/bash
set -e # Exit on error

echo "Configuring Postgres..."
service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'welcome@123';"
sudo -u postgres psql -c "CREATE DATABASE quizz;" || true

echo "Writing Env..."
cat > /var/www/quizz/backend/.env <<EOF
DATABASE_URL=postgresql://postgres:welcome%40123@localhost:5432/quizz
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PORT=5000
NODE_ENV=production
EOF

echo "Building Backend..."
cd /var/www/quizz/backend
npm install
# DB Push
npm run db:push
npm run seed:all-questions
npm run build

echo "Building Frontend..."
cd /var/www/quizz/frontend
npm install
npm run build

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/quizz <<EOF
server {
    listen 80;
    server_name 188.245.121.231;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/quizz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
service nginx restart

echo "Starting PM2..."
cd /var/www/quizz
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

echo "Done!"
