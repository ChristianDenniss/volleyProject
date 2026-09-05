# Roblox Volleyball League

Official website and management platform for the Roblox Volleyball League – a modern web application for teams, matches, and player statistics.

## Stack

- **Hosting & Backend**: Cloudflare Worker with [vinext](https://github.com/vinxi/vinext) App Router
- **Database**: Cloudflare D1 (SQLite)
- **API**: tRPC (type-safe client-server communication)
- **Authentication**: better-auth with Roblox OAuth
- **Frontend**: React + Tailwind CSS

## Local Development

### Prerequisites

- Node.js (v18 or later)
- [pnpm](https://pnpm.io/)
- Cloudflare account (for D1 and Workers)

### Setup

```bash
# Install dependencies
pnpm install

# Prepare environment, run migrations, and seed local database
pnpm t3:prepare

# Start the development server (applies migrations automatically)
pnpm dev
