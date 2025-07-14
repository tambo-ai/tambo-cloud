# Tambo Self-Hosting with Docker

This guide will help you set up Tambo for self-hosting using Docker and Docker Compose, including a curated set of Supabase services.

## 🚀 Quick Start

1. **Run the setup script:**

   ```bash
   ./scripts/tambo-setup.sh
   ```

2. **Configure your environment:**
   - Edit `docker.env` with your actual values
   - Update passwords, API keys, and other secrets

3. **Start the stack:**

   ```bash
   ./scripts/tambo-start.sh
   ```

4. **Access your applications:**
   - Tambo Web: http://localhost:3000
   - Tambo API: http://localhost:3001
   - Supabase Studio: http://localhost:8000

## 📋 Prerequisites

- Docker and Docker Compose installed
- `jq` command-line tool (for Supabase updates)
- At least 4GB RAM and 10GB free disk space

## 🏗️ Architecture

The setup includes:

### Tambo Services

- **Web (Next.js)**: Frontend application on port 3000
- **API (NestJS)**: Backend API on port 3001

### Supabase Services

- **Database (PostgreSQL)**: Database on port 5432
- **Auth (GoTrue)**: Authentication service
- **REST API (PostgREST)**: Auto-generated REST API
- **Realtime**: WebSocket connections for real-time features
- **Studio**: Database management interface on port 8000
- **Kong Gateway**: API gateway on port 8000

### Excluded Services

The following Supabase services are excluded to keep the setup minimal:

- Storage (file storage)
- Inbucket (email testing)
- Analytics
- Edge Functions

## 📁 File Structure

```
tambo-cloud/
├── docker-compose.yml              # Main Tambo services
├── docker-compose.supabase.yml     # Supabase services
├── docker.env.example              # Environment variables template
├── README.docker.md                # This file
├── apps/
│   ├── web/Dockerfile              # Web service Docker image
│   └── api/Dockerfile              # API service Docker image
├── scripts/
│   ├── tambo-setup.sh              # Initial setup script
│   ├── tambo-start.sh              # Start the stack
│   ├── tambo-stop.sh               # Stop the stack
│   ├── tambo-logs.sh               # View logs
│   └── update-supabase.sh          # Update Supabase files
└── docker/
    └── supabase/                   # Downloaded Supabase files
```

## ⚙️ Configuration

### Environment Variables

Key environment variables to configure in `docker.env`:

#### Required

- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret (32+ characters)
- `OPENAI_API_KEY`: OpenAI API key
- `API_KEY_SECRET`: Tambo API key secret
- `PROVIDER_KEY_SECRET`: Provider key secret

#### Optional

- `SMTP_*`: Email configuration
- `POSTHOG_*`: Analytics configuration
- `LANGFUSE_*`: Tracing configuration
- `SLACK_*`: Slack integration

### Supabase Configuration

The Supabase setup includes:

- Database with proper extensions and roles
- Authentication with configurable signup/signin
- REST API with automatic schema reflection
- Real-time subscriptions
- Studio for database management

## 🔧 Management Scripts

### Setup

```bash
./scripts/tambo-setup.sh
```

Downloads Supabase files and prepares the environment.

### Start Stack

```bash
./scripts/tambo-start.sh
```

Starts all services in the correct order.

### Stop Stack

```bash
./scripts/tambo-stop.sh
```

Stops all services and cleans up.

### View Logs

```bash
./scripts/tambo-logs.sh [service-name]
```

Shows logs for all services or a specific service.

### Update Supabase

```bash
./scripts/update-supabase.sh
```

Downloads the latest Supabase Docker files.

## 🔐 Security

### Default Credentials

- **Supabase Studio**: `supabase` / `this_password_is_insecure_and_should_be_updated`
- **Database**: `postgres` / `your-super-secret-and-long-postgres-password`

⚠️ **Important**: Change all default passwords before production use!

### JWT Tokens

The setup includes default JWT tokens for development. For production:

1. Generate a strong 32+ character JWT secret
2. Use the secret to generate new anon and service role keys
3. Update the keys in `docker.env`

## 🗄️ Database

### Connection Details

- **Host**: `localhost` (from host) or `supabase-db` (from containers)
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: Set in `docker.env`

### Connection String

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres
```

## 🔄 Updates

### Updating Tambo

1. Pull the latest code
2. Rebuild the containers: `docker compose build`
3. Restart the stack: `./scripts/tambo-start.sh`

### Updating Supabase

1. Run: `./scripts/update-supabase.sh`
2. Restart the stack: `./scripts/tambo-start.sh`

## 🐛 Troubleshooting

### Common Issues

#### Services won't start

- Check if ports 3000, 3001, 5432, 8000 are available
- Verify `docker.env` is properly configured
- Check logs: `./scripts/tambo-logs.sh`

#### Database connection issues

- Ensure database is healthy: `docker compose ps`
- Check database logs: `./scripts/tambo-logs.sh supabase-db`
- Verify DATABASE_URL in `docker.env`

#### Authentication issues

- Check Supabase Studio is accessible at http://localhost:8000
- Verify JWT_SECRET and API keys are correct
- Check auth logs: `./scripts/tambo-logs.sh supabase-auth`

### Reset Everything

```bash
./scripts/tambo-stop.sh
docker system prune -f
docker volume prune -f
./scripts/tambo-start.sh
```

## 📊 Monitoring

### Health Checks

Services include health checks. Monitor with:

```bash
docker compose ps
```

### Logs

- All logs: `./scripts/tambo-logs.sh`
- Specific service: `./scripts/tambo-logs.sh web`
- Follow logs: `./scripts/tambo-logs.sh web | tail -f`

## 🚀 Production Deployment

For production deployment:

1. **Security**: Update all default passwords and secrets
2. **SSL**: Add SSL/TLS termination (nginx proxy, cloudflare, etc.)
3. **Backup**: Set up database backups
4. **Monitoring**: Add monitoring and alerting
5. **Resources**: Scale resources based on load
6. **Updates**: Establish update procedures

## 🆘 Support

If you encounter issues:

1. Check the logs: `./scripts/tambo-logs.sh`
2. Review the configuration in `docker.env`
3. Ensure all prerequisites are met
4. Check the troubleshooting section above

## 📝 License

This setup is provided under the same license as the Tambo project.
