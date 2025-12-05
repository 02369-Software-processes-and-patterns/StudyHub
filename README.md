# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Install guide

# create a new project in the current directory
# StudyHub — Install & Run Guide

This repository contains the StudyHub SvelteKit application.

**Quick start:** follow the steps below to get the project running locally.

**Prerequisites**
- **Node:** v18 or newer recommended.
- **Git:** for cloning the repository.
- **Package manager:** `npm` (bundled with Node) or `pnpm`/`yarn` if preferred.

**Clone the repository**
```
git clone https://github.com/02369-Software-processes-and-patterns/StudyHub.git
cd StudyHub
```

**Install dependencies**
```
npm install
```

**Environment variables**
Create a `.env.local` file in the project root with your Supabase credentials. The app expects these public keys as static public env vars:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```
The vars can be found in the project report under the demonstration section.

**Run the app in development**
```
npm run dev
```
Open the address shown in the terminal (typically`http://localhost:5173/` or the URL printed by `vite`).
```
**Tests & tooling**
- Run unit tests: `npm run test` (runs Vitest unit suite).
- Run lint checks: `npm run lint`.
- Format code: `npm run format`.

**Helpful files and locations**
- Supabase config: `supabase/config.toml`.
- Migrations: `supabase/migrations/`.
- Server hooks (Supabase client setup): `src/hooks.server.ts`.
