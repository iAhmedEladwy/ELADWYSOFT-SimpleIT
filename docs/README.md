# SimpleIT - IT Asset Management System

SimpleIT is a comprehensive IT asset management solution designed for ELADWYSOFT. The system streamlines the tracking and management of IT assets, employee information, tickets, and related activities.

## Documentation

This docs directory contains comprehensive documentation for the SimpleIT system:

- [System Documentation](./SimpleIT_System_Documentation.md) - Detailed overview of system features, architecture, and functionality
- [Deployment Guide](./SimpleIT_Deployment_Guide.md) - Step-by-step instructions for deploying SimpleIT on Ubuntu and Windows servers

## Features

- Comprehensive asset lifecycle management
- Asset check-in/check-out functionality with categorized reasons
- Detailed asset depreciation calculations
- Employee management and asset assignment
- Ticketing system for IT support
- Extensive reporting capabilities
- Customizable asset types, brands, and statuses
- Detailed audit logging
- Multi-language support

## Technology Stack

- **Frontend**: React, TypeScript, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with PostgreSQL session store

## Getting Started

### Quick Start with Docker (Recommended)

#### For Linux/macOS

```bash
# Clone repository
git clone https://github.com/eladwysoft/simpleit.git && cd simpleit

# One-click deployment with our Linux/macOS script
chmod +x docs/deploy-script.sh && ./docs/deploy-script.sh

# Access the application at http://your-server-ip
# Default login: admin / admin123
```

#### For Windows

```bash
# Clone repository
git clone https://github.com/eladwysoft/simpleit.git
cd simpleit

# One-click deployment with our Windows script
docs\deploy-windows-docker.bat

# Access the application at http://localhost
# Default login: admin / admin123
```

The one-click deployment scripts handle everything automatically:
- Create all necessary Docker configuration files
- Start the Docker containers
- Initialize the database
- Provide access instructions

### Standard Setup

1. Review the [System Documentation](./SimpleIT_System_Documentation.md) to understand the system's capabilities
2. Follow the [Deployment Guide](./SimpleIT_Deployment_Guide.md) to set up SimpleIT on your server
3. After installation, log in with the default admin credentials (username: admin, password: admin123)
4. Update your password immediately
5. Configure system settings in the Settings section
6. Begin adding employees and assets to the system

## Support

For support inquiries, please contact ELADWYSOFT support team.