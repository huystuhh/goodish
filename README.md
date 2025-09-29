# Goodish

A web application that curates and displays positive news articles from various RSS feeds. Built with modern web technologies and designed to be easily portable to mobile platforms.

## Features

- **Curated Good News**: Automatically fetches and displays positive news articles from trusted sources
- **Simple Navigation**: Easy next/previous navigation through articles
- **Mobile-First Design**: Responsive design that works great on all devices
- **Keyboard Navigation**: Use arrow keys to navigate between articles
- **Modern Tech Stack**: Built with React, TypeScript, and Vite for fast development
- **Serverless Architecture**: Uses Cloudflare Workers for RSS fetching and API endpoints

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)

### Local Development

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd goodish
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` to see the application.

### Project Structure

```
goodish/
├── src/
│   ├── components/          # React components
│   │   ├── ArticleViewer.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── LoadingSpinner.tsx
│   ├── store/              # Zustand state management
│   │   └── useArticleStore.ts
│   ├── services/           # API services
│   │   └── articleService.ts
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── workers/                # Cloudflare Worker
│   ├── api.ts
│   ├── package.json
│   └── wrangler.toml
├── public/
│   └── _redirects         # Cloudflare Pages routing
└── README.md
```

## Architecture

### Frontend (React + TypeScript)
- **Vite**: Fast development and build tool
- **React 19**: Modern React with concurrent features
- **TypeScript**: Type safety and better developer experience
- **Zustand**: Lightweight state management
- **Tanstack Query**: Data fetching and caching

### Backend (Cloudflare Worker)
- **RSS Processing**: Fetches and parses RSS feeds from good news sources
- **API Endpoints**: RESTful API for articles and feeds
- **CORS Handling**: Cross-origin requests support
- **Edge Computing**: Fast global response times

### Key Components

1. **ArticleViewer**: Displays individual articles with metadata and actions
2. **Navigation**: Handles article navigation with progress tracking
3. **useArticleStore**: Manages application state (articles, current index, loading states)
4. **articleService**: Handles API communication with the Cloudflare Worker

## Mobile Portability

The codebase is designed with React Native portability in mind:

- **Shared Business Logic**: Store and services can be reused in React Native
- **Component Architecture**: Components are structured for easy porting
- **TypeScript**: Consistent types across platforms
- **Mobile-First CSS**: Responsive design principles

### Future Mobile Development

To port to React Native:
1. Install React Native CLI or Expo
2. Create new React Native project
3. Copy `src/store`, `src/services`, and `src/types` directories
4. Recreate UI components using React Native components
5. Adapt navigation using React Navigation

## Deployment

### Cloudflare Pages + Workers

1. **Setup Cloudflare Workers:**
   ```bash
   cd workers
   npm install
   npx wrangler login
   npm run deploy
   ```

2. **Setup Cloudflare Pages:**
   - Connect your GitHub repository to Cloudflare Pages
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: Set `VITE_API_URL` to your worker URL

3. **Update configuration:**
   - Update `workers/wrangler.toml` with your domain
   - Update `public/_redirects` with your worker URL

### Environment Variables

- `VITE_API_URL`: URL of your Cloudflare Worker (for production)

## Development

### RSS Feed Sources

Current good news sources include:
- Good News Network
- Positive News
- Upworthy
- The Optimist
- HuffPost Good News

### Adding New RSS Feeds

Edit `workers/api.ts` and add to the `RSS_FEEDS` array:

```typescript
{
  url: 'https://example.com/feed/',
  name: 'Example News',
  category: 'general'
}
```

### Customization

- **Styling**: Modify `src/App.css` for visual changes
- **Article Display**: Update `src/components/ArticleViewer.tsx`
- **Navigation**: Customize `src/components/Navigation.tsx`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] AI-powered sentiment analysis for better article filtering
- [ ] User preferences and personalization
- [ ] Article bookmarking and sharing
- [ ] Mobile app development (React Native)
- [ ] Push notifications for new good news
- [ ] Social features and community interactions
- [ ] Offline reading capabilities
- [ ] Multi-language support

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **State Management**: Zustand
- **Data Fetching**: Tanstack Query, Axios
- **Styling**: CSS3 with modern features
- **Backend**: Cloudflare Workers
- **Deployment**: Cloudflare Pages + Workers
- **Future Mobile**: React Native

---

Built with ❤️ for spreading positivity, one article at a time.
