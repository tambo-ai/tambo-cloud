# Tambo Cloud Monorepo

## Overview

This repository is a monorepo for the Tambo Cloud platform, providing AI-assisted development tools for teams and individuals.

## Repository Structure

The repository is organized into two main directories:

### Applications

The main applications are located in the [apps](./apps) directory:

- [web](./apps/web) - The Next.js frontend application, including the landing page and project dashboard
- [api](./apps/api) - The NestJS API server, including Swagger UI documentation and API routes

### Shared Libraries

Reusable libraries are located in the [packages](./packages) directory:

- [backend](./packages/backend) - A library for interacting with the LLM
- [@tambo-ai-cloud/core](./packages/core) - A library for basic shared utilities/etc.
- [@tambo-ai-cloud/db](./packages/db) - A library for interacting with the database. This is mostly the drizzle schema and migrations.

There also are some basic supporting packages only used during development:

- [eslint-config](./packages/eslint-config) - ESLint configurations for the project, with specific configs for Next.js apps and libraries
- [typescript-config](./packages/typescript-config) - TypeScript configurations with specific settings for Next.js apps and libraries

## Key Features

- **AI-Assisted Development**: Leverage LLMs to enhance your development workflow
- **Project Management**: Create and manage AI projects through an intuitive dashboard
- **API Integration**: Connect your applications with our secure API
- **Collaborative Workspace**: Share projects and collaborate with team members

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: NestJS, TypeScript, Swagger
- **Database**: PostgreSQL, Drizzle ORM
- **Infrastructure**: Supabase for local development
- **Tools**: Turborepo for monorepo management

## Getting Started

### Quick Start

We provide a setup script to help you get started quickly:

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The setup script will:

1. Check and install prerequisites (Node.js, npm, Supabase CLI)
2. Install project dependencies
3. Set up Supabase locally
4. Create environment files from templates

You can also preview what the script will do without making any changes:

```bash
./setup.sh --dry-run
```

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **Supabase CLI**
- **Docker** (for running Supabase locally)

### Manual Development Setup

If you prefer to set things up manually, follow these steps:

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create `.env` files in the following locations using their respective `.env.example` templates:

   - `apps/api/.env`
   - `apps/web/.env.local`
   - `packages/db/.env`

3. **Database Setup**:

   ```bash
   # Initialize Supabase
   npx supabase login
   npx supabase link
   npx supabase start

   # Run migrations
   cd packages/db
   npm run db:migrate
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Common Commands

- `npm run dev` - Runs the API and web apps in development mode
- `npm run build` - Builds all applications
- `npm run lint` - Runs linting across all applications
- `npm run check-types` - Checks TypeScript types across all applications

You can also use Turborepo directly with `turbo dev`, `turbo build`, etc.

## API Key Setup

After setting up your local environment, configure your Tambo API key:

1. Start your local environment:

   ```bash
   npm run dev
   ```

2. Get your API key:

   - Visit: `http://localhost:3000/dashboard`
   - Login with your credentials
   - Create a new project
   - Generate your API key

3. Configure the API key:

   - Add the key to `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
   ```

4. Verify your setup:
   - Visit: `http://localhost:3000/internal/smoketest`

## Contributing

We welcome contributions to Tambo Cloud! Please see our contribution guidelines for more information on how to get involved.

## Frontend

The landing page and dashboard are built with:

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
