export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  url: string;
  source: string;
  publishedDate: string;
  imageUrl?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags?: string[];
}

export interface RSSFeed {
  url: string;
  name: string;
  category: string;
}

export interface AppState {
  articles: Article[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}