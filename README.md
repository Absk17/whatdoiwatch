# WhatDoIWatch?

A mood-based watch recommendation app for meal time. Answer 6 questions, get a verified pick from your streaming service.

## Stack
- Next.js 14
- Anthropic Claude API (recommendations)
- TMDB API (streaming availability verification for India)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Add these environment variables in Vercel:
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `TMDB_API_KEY` — from themoviedb.org/settings/api
4. Deploy

## Environment variables

Copy `.env.example` to `.env.local` and fill in your keys.
