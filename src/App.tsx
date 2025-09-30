import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArticleViewer } from './components/ArticleViewer';
import { Header } from './components/Header';
import { Navigation, useKeyboardNavigation } from './components/Navigation';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useArticleStore } from './store/useArticleStore';
import { articleService } from './services/articleService';
import { ARTICLES_PER_PAGE } from './constants';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const {
    articles,
    isLoading,
    error,
    setArticles,
    setLoading,
    setError
  } = useArticleStore();

  // Always call hooks at the top level
  useKeyboardNavigation();

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const response = await articleService.fetchArticles();
        if (response.success) {
          setArticles(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to load articles');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [setArticles, setLoading, setError]);

  if (isLoading) {
    return (
      <div className="app">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="app">
        <Header />
        <div className="empty-state">
          <h2>No articles available</h2>
          <p>Check back later for good news stories!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app"
      style={{ '--articles-per-page': ARTICLES_PER_PAGE } as React.CSSProperties}
    >
      <Header />
      <ArticleViewer />
      <Navigation />
      <footer className="attribution">
        <a href="https://www.flaticon.com/packs/emoji-310" title="smile icons" target="_blank">Favicon by Illosalz</a>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
