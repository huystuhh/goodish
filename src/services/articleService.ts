import type { Article, ApiResponse } from '../types';
import { ARTICLES_PER_PAGE, RSS_FEEDS, FALLBACK_IMAGES } from '../constants';

// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ArticleService {
  private static instance: ArticleService;
  private cachedArticles: Article[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - longer cache
  private usedArticleIds: Set<string> = new Set(); // Track used articles for rotation
  private ongoingFetch: Promise<ApiResponse<Article[]>> | null = null; // Prevent duplicate fetches

  static getInstance(): ArticleService {
    if (!ArticleService.instance) {
      ArticleService.instance = new ArticleService();
    }
    return ArticleService.instance;
  }

  async fetchArticles(forceRefresh = false): Promise<ApiResponse<Article[]>> {
    // If there's already an ongoing fetch, return that promise to avoid duplicates
    if (!forceRefresh && this.ongoingFetch) {
      return this.ongoingFetch;
    }

    // Start the fetch process and store the promise
    this.ongoingFetch = this.performFetch(forceRefresh);

    try {
      const result = await this.ongoingFetch;
      return result;
    } finally {
      // Clear the ongoing fetch when done
      this.ongoingFetch = null;
    }
  }

  private async performFetch(forceRefresh: boolean): Promise<ApiResponse<Article[]>> {
    try {
      // Clear cache if forcing refresh
      if (forceRefresh) {
        this.cachedArticles = null;
        this.lastFetchTime = 0;
      }

      // Check if we have cached articles that are still fresh (unless forcing refresh)
      const now = Date.now();
      if (!forceRefresh && this.cachedArticles && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        const rotatedArticles = this.getRotatedArticlesFromCache();
        if (rotatedArticles.length > 0) {
          return {
            data: rotatedArticles,
            success: true
          };
        }
      }


      // Try to fetch from RSS feeds using a CORS proxy
      const allArticles: Article[] = [];

      // For single article mode, just pick one random feed and fetch from it
      // This is much faster than fetching from all feeds
      const shuffledFeeds = [...RSS_FEEDS].sort(() => Math.random() - 0.5);

      // Try feeds one by one until we get articles
      for (const feedUrl of shuffledFeeds) {
        try {
          const feedArticles = await this.fetchSingleFeed(feedUrl);
          if (feedArticles.length > 0) {
            allArticles.push(...feedArticles);
            break; // Stop after first successful feed for speed
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${this.getFeedName(feedUrl)}:`, error);
          continue; // Try next feed
        }
      }

      // Select articles ensuring source diversity
      const selectedArticles = this.selectDiverseArticles(allArticles, ARTICLES_PER_PAGE);

      // If we got some articles from RSS, use them, otherwise fall back to mock data
      if (allArticles.length > 0) {
        // Cache all fetched articles for rotation, return selected ones
        this.cachedArticles = allArticles;
        this.lastFetchTime = now;
        // Reset used articles when we get fresh content
        this.usedArticleIds.clear();
        // Mark the selected articles as used
        selectedArticles.forEach(article => this.usedArticleIds.add(article.id));

        return {
          data: selectedArticles,
          success: true
        };
      }


      // Fallback to mock data
      await this.delay(1000); // Simulate network delay
      const mockArticles: Article[] = [
        {
          id: '1',
          title: 'Scientists Develop Revolutionary Ocean Cleanup Technology',
          excerpt: 'Researchers have created an innovative system that can remove plastic waste from oceans while protecting marine life. The breakthrough technology uses biodegradable materials and has shown promising results in initial trials, potentially removing millions of tons of plastic annually.',
          url: 'https://example.com/ocean-cleanup',
          source: 'Environmental Science Daily',
          publishedDate: new Date(Date.now() - 86400000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
          sentiment: 'positive',
          tags: ['environment', 'technology', 'ocean']
        },
        {
          id: '2',
          title: 'Community Gardens Transform Urban Neighborhoods',
          excerpt: 'A grassroots initiative has transformed vacant lots into thriving gardens, providing fresh produce to food-insecure neighborhoods while building stronger communities and teaching valuable agricultural skills to residents of all ages.',
          url: 'https://example.com/community-gardens',
          source: 'Local News Network',
          publishedDate: new Date(Date.now() - 172800000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
          sentiment: 'positive',
          tags: ['community', 'agriculture', 'urban development']
        },
        {
          id: '3',
          title: 'Breakthrough Battery Technology Revolutionizes Renewable Energy',
          excerpt: 'Engineers have developed a new battery technology that can store renewable energy for weeks, solving one of the biggest challenges in sustainable power generation and bringing us significantly closer to a carbon-neutral future.',
          url: 'https://example.com/battery-breakthrough',
          source: 'Tech Innovation Today',
          publishedDate: new Date(Date.now() - 259200000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
          sentiment: 'positive',
          tags: ['technology', 'renewable energy', 'innovation']
        },
        {
          id: '4',
          title: 'Reading Program Transforms Students\' Lives',
          excerpt: 'An innovative reading program that pairs students with community volunteers has dramatically improved literacy rates by 40%, with participating students showing increased confidence, academic performance, and genuine love for learning.',
          url: 'https://example.com/reading-program',
          source: 'Education Weekly',
          publishedDate: new Date(Date.now() - 345600000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
          sentiment: 'positive',
          tags: ['education', 'literacy', 'community']
        },
        {
          id: '5',
          title: 'Wildlife Conservation Success Story: Species Population Triples',
          excerpt: 'Thanks to dedicated conservation efforts and community involvement, the population of a critically endangered species has increased by 300% over the past five years, demonstrating that targeted conservation efforts can create meaningful change.',
          url: 'https://example.com/wildlife-conservation',
          source: 'Nature Conservation News',
          publishedDate: new Date(Date.now() - 432000000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=800',
          sentiment: 'positive',
          tags: ['wildlife', 'conservation', 'success story']
        }
      ];

      // Take only the specified number of mock articles and cache them
      const selectedMockArticles = mockArticles.slice(0, ARTICLES_PER_PAGE);
      this.cachedArticles = selectedMockArticles;
      this.lastFetchTime = now;

      return {
        data: selectedMockArticles,
        success: true
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch articles'
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchSingleFeed(feedUrl: string): Promise<Article[]> {
    try {
      // Try multiple CORS proxies
      const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`
      ];

      let xmlContent = null;

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
          });

          if (response.ok) {
            if (proxyUrl.includes('allorigins')) {
              const data = await response.json();
              xmlContent = data.contents;
            } else {
              xmlContent = await response.text();
            }

            if (xmlContent && (xmlContent.includes('<rss') || xmlContent.includes('<feed'))) {
              break; // Found valid RSS content
            }
          }
        } catch (proxyError) {
            continue;
        }
      }

      if (xmlContent) {
        const feedArticles = this.parseRSSFeedMultiple(xmlContent, this.getFeedName(feedUrl));
        return feedArticles;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  private getRotatedArticlesFromCache(): Article[] {
    if (!this.cachedArticles) return [];

    // Find articles we haven't used yet
    const unusedArticles = this.cachedArticles.filter(article =>
      !this.usedArticleIds.has(article.id)
    );

    if (unusedArticles.length === 0) {
      // All articles have been used, reset and start over
      this.usedArticleIds.clear();
      return this.getRotatedArticlesFromCache();
    }

    // Select diverse articles from unused ones
    const selectedArticles = this.selectDiverseArticles(unusedArticles, ARTICLES_PER_PAGE);

    // Mark them as used
    selectedArticles.forEach(article => this.usedArticleIds.add(article.id));

    return selectedArticles;
  }

  private parseRSSFeedMultiple(xmlText: string, sourceName: string): Article[] {
    try {
      // Clean up the XML text
      const cleanXml = xmlText
        .replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;') // Fix unescaped ampersands
        .trim();

      // Create a DOM parser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanXml, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.warn('XML parsing error:', parserError.textContent);
        return [];
      }

      // Get all item elements
      const items = xmlDoc.querySelectorAll('item');
      const articles: Article[] = [];

      // Parse up to 10 articles from this feed
      const maxArticles = Math.min(10, items.length);
      for (let index = 0; index < maxArticles; index++) {
        const item = items[index];
        const title = item.querySelector('title')?.textContent?.trim();
        const link = item.querySelector('link')?.textContent?.trim();
        const description = item.querySelector('description')?.textContent?.trim();
        const pubDate = item.querySelector('pubDate')?.textContent?.trim();

        if (title && link && description) {
          // Extract image using same logic as before
          const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent;
          const mediaContent = item.querySelector('media\\:content, content')?.getAttribute('url');
          const mediaThumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url');
          const enclosure = item.querySelector('enclosure')?.getAttribute('url');
          let imageUrl = mediaContent || mediaThumbnail;

          // Try to extract image from enclosure
          if (!imageUrl && enclosure && enclosure.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            imageUrl = enclosure;
          }

          // Try to extract image from description HTML
          if (!imageUrl && description) {
            const imgPatterns = [
              /<img[^>]+src=["']([^"'>]+)["']/i,
              /<img[^>]+src=([^\s>]+)/i,
              /src=["']([^"'>]+\.(?:jpg|jpeg|png|gif|webp))["']/i
            ];

            for (const pattern of imgPatterns) {
              const match = description.match(pattern);
              if (match) {
                imageUrl = match[1];
                break;
              }
            }
          }

          // Try to extract image from content:encoded
          if (!imageUrl && contentEncoded) {
            const imgPatterns = [
              /<img[^>]+src=["']([^"'>]+)["']/i,
              /<img[^>]+src=([^\s>]+)/i,
              /src=["']([^"'>]+\.(?:jpg|jpeg|png|gif|webp))["']/i
            ];

            for (const pattern of imgPatterns) {
              const match = contentEncoded.match(pattern);
              if (match) {
                imageUrl = match[1];
                break;
              }
            }
          }

          // Fallback: use a placeholder image if no image found
          if (!imageUrl) {
            imageUrl = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
          }

          articles.push({
            id: `rss-${sourceName}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: this.cleanText(title),
            excerpt: this.cleanText(description).substring(0, 800) + (description.length > 800 ? '...' : ''),
            url: link,
            source: sourceName,
            publishedDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            imageUrl: imageUrl || undefined,
            sentiment: 'positive',
            tags: ['news', 'positive']
          });
        }
      }

      return articles;
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      return [];
    }
  }

  private cleanText(text: string): string {
    if (!text) return '';

    // First pass: decode HTML entities using textarea
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    let decoded = textarea.value;

    // Second pass: handle numeric HTML entities first
    decoded = decoded.replace(/&#(\d+);/g, (_match, num) => {
      return String.fromCharCode(parseInt(num, 10));
    });

    // Handle hex numeric entities
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Third pass: handle named entities that might not be caught
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');

    return decoded
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();
  }

  private getFeedName(feedUrl: string): string {
    if (feedUrl.includes('goodnewsnetwork')) return 'Good News Network';
    if (feedUrl.includes('positive.news')) return 'Positive News';
    if (feedUrl.includes('optimistdaily')) return 'The Optimist Daily';
    if (feedUrl.includes('reasonstobecheerful')) return 'Reasons to be Cheerful';
    if (feedUrl.includes('notallnewsisbad')) return 'Not All News is Bad';
    return 'Good News Source';
  }

  private selectDiverseArticles(allArticles: Article[], targetCount: number): Article[] {
    if (allArticles.length === 0) return [];

    // Group articles by source
    const articlesBySource = new Map<string, Article[]>();
    for (const article of allArticles) {
      if (!articlesBySource.has(article.source)) {
        articlesBySource.set(article.source, []);
      }
      articlesBySource.get(article.source)!.push(article);
    }

    // Shuffle articles within each source
    for (const [source, articles] of articlesBySource.entries()) {
      articlesBySource.set(source, this.shuffleArray(articles));
    }

    // Select articles round-robin from different sources
    const selected: Article[] = [];
    const sources = Array.from(articlesBySource.keys());
    let sourceIndex = 0;

    while (selected.length < targetCount && selected.length < allArticles.length) {
      const currentSource = sources[sourceIndex % sources.length];
      const sourceArticles = articlesBySource.get(currentSource)!;

      // Find an article from this source that we haven't selected yet
      const availableArticles = sourceArticles.filter(article =>
        !selected.some(selected => selected.id === article.id)
      );

      if (availableArticles.length > 0) {
        // Pick a random article from available ones instead of always the first
        const randomIndex = Math.floor(Math.random() * availableArticles.length);
        selected.push(availableArticles[randomIndex]);
      }

      sourceIndex++;

      // If we've gone through all sources and still need more articles,
      // break to avoid infinite loop
      if (sourceIndex >= sources.length * targetCount) {
        break;
      }
    }

    return selected;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const articleService = ArticleService.getInstance();