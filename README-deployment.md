
# Animorphs TCG Deployment Guide

## Overview
Complete deployment guide for the Animorphs Trading Card Game on Contabo VPS (195.179.228.179).

## Architecture
- **Frontend**: React/Vite application served by Apache
- **Backend**: PHP 8.1 REST API with MariaDB
- **Server**: Ubuntu 22.04 on Contabo VPS
- **Database**: MariaDB 10.6.22
- **Web Server**: Apache 2.4

## Pre-Deployment Checklist
- [x] Contabo VPS is active (195.179.228.179)
- [x] SSH access configured
- [x] Domain DNS pointed to server IP
- [x] All environment variables documented

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install LAMP stack
sudo apt install -y apache2 php8.1 php8.1-mysql php8.1-cli php8.1-curl php8.1-json php8.1-mbstring mariadb-server

# Install Node.js for frontend build
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2. Application Deployment
```bash
# Create application directory
sudo mkdir -p /var/www/animorphs
sudo chown -R www-data:www-data /var/www/animorphs

# Clone/upload application files
# Copy all backend and frontend code to /var/www/animorphs/

# Backend setup
cd /var/www/animorphs/backend
composer install --no-dev --optimize-autoloader

# Frontend build
cd /var/www/animorphs/frontend
npm install
npm run build
```

### 3. Database Setup
```bash
# Start MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Create database and user
mysql -u root -e "CREATE DATABASE IF NOT EXISTS animorphs_db;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'lovable_admin'@'localhost' IDENTIFIED BY 'zwsQGJtuhRwQu7M';"
mysql -u root -e "GRANT ALL PRIVILEGES ON animorphs_db.* TO 'lovable_admin'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Import schema
mysql -u lovable_admin -pzwsQGJtuhRwQu7M animorphs_db < /var/www/animorphs/database/schema.sql
```

### 4. Apache Configuration
```bash
# Copy Apache config
sudo cp /var/www/animorphs/deploy/apache-config.conf /etc/apache2/sites-available/animorphs.conf

# Enable modules and site
sudo a2enmod rewrite headers
sudo a2ensite animorphs.conf
sudo a2dissite 000-default.conf

# Restart Apache
sudo systemctl restart apache2
```

### 5. Security Configuration
```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Set proper file permissions
sudo chown -R www-data:www-data /var/www/animorphs
sudo chmod -R 755 /var/www/animorphs
```

## Post-Deployment Tasks

### 1. Asset Upload
- Upload 200 card images to `/var/www/animorphs/frontend/dist/cards/`
  - Format: `card-{token_id}.png` (e.g., `card-1.png`, `card-2.png`, etc.)
- Upload NFT metadata JSON to `/var/www/animorphs/frontend/dist/nft-metadata.json`

### 2. Music Library
- Upload MP3 files to `/media/ZypherDan/` with subdirectories:
  - `good/` (~81 tracks)
  - `kids&teens/` (~33 tracks)
  - `great/` (~40 tracks)
  - `ok_songs/` (~81 tracks)

### 3. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Obtain SSL certificate
sudo certbot --apache -d tcg.mythicmasters.org.za
```

## Testing

### API Endpoints
Run the test script to verify all endpoints:
```bash
bash /var/www/animorphs/deploy/test-endpoints.sh
```

### Manual Testing
1. **Website**: Visit `http://195.179.228.179`
2. **API**: Test key endpoints:
   - `GET /api/cards` - Get all cards
   - `POST /api/auth/login` - User authentication
   - `GET /api/music/songs` - Get music library
   - `GET /api/leaderboard` - Get rankings

### Frontend Testing
1. **Demo Mode**: Test 10v10 AI battles without login
2. **Authentication**: Test EOS login flow
3. **Collection**: Verify card display and filtering
4. **Music Player**: Test audio streaming
5. **Battle System**: Test turn-based combat

## Environment Files

### Backend (.env)
Located at `/var/www/animorphs/backend/.env`:
- Database credentials
- EOS configuration
- YoCo payment keys
- JWT secret

### Frontend (.env.production)
Located at `/var/www/animorphs/frontend/.env.production`:
- API base URL
- Public keys only
- Client-side configuration

## Monitoring & Logs

### Apache Logs
- Error log: `/var/log/apache2/animorphs_error.log`
- Access log: `/var/log/apache2/animorphs_access.log`

### PHP Logs
- Check `/var/log/apache2/error.log` for PHP errors

### Database Logs
- MariaDB logs in `/var/log/mysql/`

## Backup Strategy

### Database Backup
```bash
mysqldump -u lovable_admin -pzwsQGJtuhRwQu7M animorphs_db > backup_$(date +%Y%m%d).sql
```

### File Backup
```bash
tar -czf animorphs_backup_$(date +%Y%m%d).tar.gz /var/www/animorphs
```

## Troubleshooting

### Common Issues
1. **API not responding**: Check Apache error logs
2. **Database connection failed**: Verify MariaDB service status
3. **Frontend not loading**: Check React build in `/var/www/animorphs/frontend/dist/`
4. **CORS errors**: Verify Apache CORS headers configuration

### Debug Commands
```bash
# Check Apache status
sudo systemctl status apache2

# Check MariaDB status
sudo systemctl status mariadb

# Check PHP version and modules
php -v && php -m

# Test database connection
mysql -u lovable_admin -pzwsQGJtuhRwQu7M -e "USE animorphs_db; SHOW TABLES;"
```

## Performance Optimization

### Apache Optimization
- Enable compression: `sudo a2enmod deflate`
- Enable caching: `sudo a2enmod expires`
- Configure KeepAlive settings

### PHP Optimization
- Install PHP-FPM: `sudo apt install php8.1-fpm`
- Configure OPcache settings
- Set appropriate memory limits

### Database Optimization
- Configure MariaDB for production workload
- Add appropriate indexes
- Set up query cache

## Security Hardening

### Apache Security
- Hide server version: `ServerTokens Prod`
- Disable directory browsing: `Options -Indexes`
- Configure security headers

### PHP Security
- Disable dangerous functions
- Set appropriate file upload limits
- Configure session security

### Database Security
- Remove anonymous users
- Disable remote root access
- Use strong passwords

## Maintenance Schedule

### Daily
- Monitor error logs
- Check disk space
- Verify service status

### Weekly
- Database backup
- Update package security patches
- Review access logs

### Monthly
- Full system backup
- Security audit
- Performance review

## Contact Information
- Domain: tcg.mythicmasters.org.za
- Server IP: 195.179.228.179
- Admin: daniel@mythicmasters.org.za

---

**Note**: This deployment creates a fully functional Animorphs TCG with placeholder systems ready for production assets (card images, NFT metadata, music files).
