#!/bin/bash

function setup-env() {
  info "writing config file"

  mkdir -p /etc/supabase || error "failed to create /etc/supabase"

  # download helper scripts
  wget -O /tmp/get-supabase-jwts.js https://github.com/train360-corp/supabase/releases/download/v__VERSION__/get-supabase-jwts.js

  DASHBOARD_USERNAME="admin"
  DASHBOARD_PASSWORD=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
  POSTGRES_PASSWORD=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
  JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
  ANON_JWT=$(node /tmp/get-supabase-jwts.js --secret "$JWT_SECRET" --type anon | tr -d '\n\r')
  SERVICE_JWT=$(node /tmp/get-supabase-jwts.js --secret "$JWT_SECRET" --type service | tr -d '\n\r')
  VAULT_ENC_KEY=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
  SECRET_KEY_BASE=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)

  # write the config file
  cat > /etc/supabase/conf.env <<EOF
############
# Secrets
############

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_JWT
SERVICE_ROLE_KEY=$SERVICE_JWT
DASHBOARD_USERNAME=$DASHBOARD_USERNAME
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
SECRET_KEY_BASE=$SECRET_KEY_BASE
VAULT_ENC_KEY=$VAULT_ENC_KEY


############
# Database - You can change these to any PostgreSQL database that has logical replication enabled.
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
# default user is postgres


############
# Supavisor -- Database pooler
############
# Port Supavisor listens on for transaction pooling connections
POOLER_PROXY_PORT_TRANSACTION=6543
# Maximum number of PostgreSQL connections Supavisor opens per pool
POOLER_DEFAULT_POOL_SIZE=20
# Maximum number of client connections Supavisor accepts per pool
POOLER_MAX_CLIENT_CONN=100
# Unique tenant identifier
POOLER_TENANT_ID=your-tenant-id
# Pool size for internal metadata storage used by Supavisor
# This is separate from client connections and used only by Supavisor itself
POOLER_DB_POOL_SIZE=5


############
# API Proxy - Configuration for the Kong Reverse proxy.
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443


############
# API - Configuration for PostgREST.
############

PGRST_DB_SCHEMAS=public,storage,graphql_public


############
# Auth - Configuration for the GoTrue authentication server.
############

## General
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=http://localhost:8000

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

## Phone auth
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true


############
# Studio - Configuration for the Dashboard
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project

STUDIO_PORT=3000
# replace if you intend to use Studio outside of localhost
SUPABASE_PUBLIC_URL=http://localhost:8000

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Add your OpenAI API key to enable SQL Editor Assistant
OPENAI_API_KEY=


############
# Functions - Configuration for Functions
############
# NOTE: VERIFY_JWT applies to all functions. Per-function VERIFY_JWT is not supported yet.
FUNCTIONS_VERIFY_JWT=false


############
# Logs - Configuration for Analytics
# Please refer to https://supabase.com/docs/reference/self-hosting-analytics/introduction
############

# Change vector.toml sinks to reflect this change
# these cannot be the same value
LOGFLARE_PUBLIC_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-public
LOGFLARE_PRIVATE_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-private

# Docker socket location - this value will differ depending on your OS
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# Google Cloud Project details
GOOGLE_PROJECT_ID=GOOGLE_PROJECT_ID
GOOGLE_PROJECT_NUMBER=GOOGLE_PROJECT_NUMBER
EOF

  chmod 644 /etc/supabase/conf.env
  ok "wrote config file to /etc/supabase/conf.env"
}

setup-env