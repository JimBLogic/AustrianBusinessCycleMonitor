# Configuration Files

This directory contains configuration files for various monitoring tools and environments.

## Structure

- `development/` - Development environment configurations
- `staging/` - Staging environment configurations  
- `production/` - Production environment configurations
- `templates/` - Configuration templates

# README for /config

This folder contains all environment configuration files for the Austrian Business Cycle Monitor project.

- Place YAML, Python, and .env files here for each environment (dev, prod, test).
- Use `monitor_config.yaml` and `monitor_config.py` as templates for new configs.
- Keep sensitive keys out of version control; use `.env.ultimate` for reference.
