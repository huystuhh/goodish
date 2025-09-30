# Goodish

> *Not perfect, just goodish. Be your goodish today!*

A positive news aggregator that displays uplifting articles from RSS feeds. Built with React, TypeScript, and Vite.

## Features

- Curates positive news from trusted sources
- Card-based responsive layout
- Jokes while loading
- No backend required - fully client-side

## Getting Started

```bash
git clone <your-repo-url>
cd goodish
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack

- React, TypeScript, Vite
- Zustand (state management)
- CSS3
- Client-side RSS parsing

## Deployment

**Cloudflare Pages:** Connect GitHub repo, set build command to `npm run build` and output directory to `dist`.

## Customization

Edit `src/constants/index.ts` to modify:
- RSS feeds (`RSS_FEEDS`)
- Jokes (`LOADING_JOKES`)
- Images (`FALLBACK_IMAGES`)

## License

MIT License
