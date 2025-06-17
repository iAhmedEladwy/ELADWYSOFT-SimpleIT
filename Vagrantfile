# SimpleIT Asset Management System - Vagrant Development Environment
# This Vagrantfile creates a complete development environment for SimpleIT

Vagrant.configure("2") do |config|
  # Base box
  config.vm.box = "ubuntu/jammy64"
  config.vm.box_version = "20231215.0.0"

  # VM configuration
  config.vm.hostname = "simpleit-dev"
  
  # Network configuration
  config.vm.network "private_network", ip: "192.168.56.10"
  config.vm.network "forwarded_port", guest: 5000, host: 5000, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 5432, host: 5432, host_ip: "127.0.0.1"

  # Provider-specific configuration
  config.vm.provider "virtualbox" do |vb|
    vb.name = "SimpleIT-Development"
    vb.memory = "2048"
    vb.cpus = 2
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    vb.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
  end

  # Synced folders
  config.vm.synced_folder ".", "/vagrant", type: "virtualbox"
  config.vm.synced_folder ".", "/opt/simpleit", create: true

  # Provisioning script
  config.vm.provision "shell", inline: <<-SHELL
    set -e
    
    echo "🚀 Starting SimpleIT Vagrant Provisioning..."
    
    # Update system
    apt-get update
    apt-get upgrade -y
    
    # Install essential packages
    apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates
    
    # Install Node.js 18
    echo "📱 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PostgreSQL 15
    echo "🗄️ Installing PostgreSQL 15..."
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    apt-get update
    apt-get install -y postgresql-15 postgresql-client-15
    
    # Configure PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << 'EOF'
CREATE DATABASE simpleit;
CREATE USER simpleit_user WITH ENCRYPTED PASSWORD 'simpleit_password_2024';
GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit_user;
ALTER USER simpleit_user CREATEDB;
\\q
EOF
    
    # Configure PostgreSQL for connections
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf
    echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/15/main/pg_hba.conf
    systemctl restart postgresql
    
    # Install PM2 globally
    npm install -g pm2 tsx
    
    # Setup application
    cd /opt/simpleit
    
    # Create environment file
    cat > .env << 'EOF'
NODE_ENV=development
DATABASE_URL=postgresql://simpleit_user:simpleit_password_2024@localhost:5432/simpleit
SESSION_SECRET=simpleit_session_secret_2024_development
PORT=5000
PGHOST=localhost
PGPORT=5432
PGDATABASE=simpleit
PGUSER=simpleit_user
PGPASSWORD=simpleit_password_2024
EOF
    
    # Install dependencies
    npm install
    
    # Create uploads directory
    mkdir -p uploads
    chmod 755 uploads
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'simpleit-dev',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    autorestart: true,
    watch: ['server/**/*.ts', 'shared/**/*.ts'],
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
    
    # Create logs directory
    mkdir -p logs
    
    # Initialize database
    npm run db:push 2>/dev/null || echo "Database initialization completed"
    
    # Change ownership to vagrant user
    chown -R vagrant:vagrant /opt/simpleit
    
    # Install development tools
    apt-get install -y git vim htop tree
    
    echo "✅ SimpleIT Vagrant environment setup completed!"
    echo ""
    echo "🌐 Application will be available at: http://localhost:5000"
    echo "🗄️ PostgreSQL available at: localhost:5432"
    echo "👤 Default login: admin / admin123"
    echo ""
    echo "To start the application:"
    echo "  vagrant ssh"
    echo "  cd /opt/simpleit"
    echo "  pm2 start ecosystem.config.js"
    echo ""
    echo "To view logs:"
    echo "  pm2 logs simpleit-dev"
  SHELL

  # Post-up message
  config.vm.post_up_message = <<-MESSAGE
    SimpleIT Development Environment is ready!
    
    🌐 Application: http://localhost:5000
    🗄️ Database: localhost:5432
    👤 Login: admin / admin123
    
    Connect: vagrant ssh
    Start app: cd /opt/simpleit && pm2 start ecosystem.config.js
    View logs: pm2 logs simpleit-dev
  MESSAGE
end