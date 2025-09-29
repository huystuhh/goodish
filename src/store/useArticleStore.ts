import { create } from 'zustand';
import type { Article, AppState } from '../types';
import { ARTICLES_PER_PAGE } from '../constants';
import { articleService } from '../services/articleService';

interface ArticleStore extends AppState {
  setArticles: (articles: Article[]) => void;
  setCurrentIndex: (index: number) => void;
  nextBatch: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getCurrentBatch: () => Article[];
  articlesPerPage: number;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  articlesPerPage: ARTICLES_PER_PAGE,

  setArticles: (articles) => set({ articles, currentIndex: 0 }),

  setCurrentIndex: (index) => {
    const { articles } = get();
    if (index >= 0 && index < articles.length) {
      set({ currentIndex: index });
    }
  },

  nextBatch: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await articleService.fetchArticles(true);
      if (response.success) {
        set({
          articles: response.data,
          currentIndex: 0,
          isLoading: false
        });
      } else {
        set({
          error: response.error || 'Failed to load articles',
          isLoading: false
        });
      }
    } catch (err) {
      set({
        error: 'An unexpected error occurred',
        isLoading: false
      });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getCurrentBatch: () => {
    const { articles, currentIndex, articlesPerPage } = get();
    return articles.slice(currentIndex, currentIndex + articlesPerPage);
  },
}));