
#!/bin/bash

# Animorphs TCG Deployment Script for Contabo VPS
# Server: 195.179.228.179

set -e

echo "Starting Animorphs TCG deployment..."

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install LAMP stack if not present
echo "Installing LAMP stack..."
sudo apt install -y apache2 php8.1 php8.1-mysql php8.1-cli php8.1-curl php8.1-json php8.1-mbstring mariadb-server

# Install Node.js and npm for frontend build
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer for PHP dependencies
echo "Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /var/www/animorphs
sudo chown -R www-data:www-data /var/www/animorphs

# Clone repository (this would be done manually or via git)
echo "Note: Repository should be cloned to /var/www/animorphs"

# Database setup
echo "Setting up database..."
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Create database and user
mysql -u root -e "CREATE DATABASE IF NOT EXISTS animorphs_db;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'lovable_admin'@'localhost' IDENTIFIED BY 'zwsQGJtuhRwQu7M';"
mysql -u root -e "GRANT ALL PRIVILEGES ON animorphs_db.* TO 'lovable_admin'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Import database schema
echo "Importing database schema..."
mysql -u lovable_admin -pzwsQGJtuhRwQu7M animorphs_db < /var/www/animorphs/database/schema.sql

# Backend setup
echo "Setting up PHP backend..."
cd /var/www/animorphs/backend
composer install --no-dev --optimize-autoloader

# Frontend setup
echo "Building React frontend..."
cd /var/www/animorphs/frontend
npm install
npm run build

# Apache configuration
echo "Configuring Apache..."
sudo cp /var/www/animorphs/deploy/apache-config.conf /etc/apache2/sites-available/animorphs.conf
sudo a2enmod rewrite headers
sudo a2ensite animorphs.conf
sudo a2dissite 000-default.conf

# Create music directory symlink if doesn't exist
sudo mkdir -p /media/ZypherDan
sudo chown -R www-data:www-data /media/ZypherDan

# Set proper permissions
sudo chown -R www-data:www-data /var/www/animorphs
sudo chmod -R 755 /var/www/animorphs

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Restart services
echo "Restarting services..."
sudo systemctl restart apache2
sudo systemctl restart mariadb

echo "Deployment completed!"
echo "Application should be available at: http://195.179.228.179"
echo ""
echo "Next steps:"
echo "1. Upload 200 card images to /var/www/animorphs/frontend/dist/cards/"
echo "2. Add NFT metadata JSON file to /var/www/animorphs/frontend/dist/"
echo "3. Upload music files to /media/ZypherDan/"
echo "4. Configure SSL certificate"
echo "5. Test all API endpoints"
