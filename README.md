# atoloan-dealer-ui

This repo contains dealer portal ui related code.

Built on the same stack as `atoloan-ui`: React 19 + Vite 7, react-router-dom v7,
chart.js, react-markdown/remark-gfm, ESLint 9 (flat config), Vitest + Testing
Library for unit tests, Playwright for e2e, and a Docker/nginx deployment setup.

## Getting started

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
npm run build       # production build to dist/
npm run lint         # eslint
npm run test:unit    # vitest
npm run test:e2e     # playwright (starts dev server automatically)
npm test              # unit + e2e
```

## Environment variables

- `.env.development` — `VITE_API_URL` for local dev
- `.env.production` — `VITE_API_URL` for production builds

## Deployment

`Dockerfile` builds the app with Vite and serves the static output via nginx
(`nginx.conf` includes SPA fallback routing and gzip compression).
