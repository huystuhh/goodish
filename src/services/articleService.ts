import type { Article, ApiResponse } from '../types';
import { ARTICLES_PER_PAGE, RSS_FEEDS, FALLBACK_IMAGES } from '../constants';

// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ArticleService {
  private static instance: ArticleService;
  private cachedArticles: Article[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ArticleService {
    if (!ArticleService.instance) {
      ArticleService.instance = new ArticleService();
    }
    return ArticleService.instance;
  }

  async fetchArticles(forceRefresh = false): Promise<ApiResponse<Article[]>> {
    try {
      // Check if we have cached articles that are still fresh (unless forcing refresh)
      const now = Date.now();
      if (!forceRefresh && this.cachedArticles && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        console.log('Using cached articles');
        return {
          data: this.cachedArticles,
          success: true
        };
      }

      // Try to fetch from RSS feeds using a CORS proxy
      const allArticles: Article[] = [];

      // Shuffle feeds to randomize which ones we try first
      const shuffledFeeds = [...RSS_FEEDS].sort(() => Math.random() - 0.5);

      // Try to fetch from all feeds (not limited by ARTICLES_PER_PAGE) to get variety
      for (const feedUrl of shuffledFeeds) {

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

                if (xmlContent && xmlContent.includes('<rss') || xmlContent.includes('<feed')) {
                  break; // Found valid RSS content
                }
              }
            } catch (proxyError) {
              console.warn(`Proxy ${proxyUrl} failed:`, proxyError);
              continue;
            }
          }

          if (xmlContent) {
            const parsedArticles = this.parseRSSFeed(xmlContent, this.getFeedName(feedUrl));
            console.log(`Fetched ${parsedArticles.length} articles from ${this.getFeedName(feedUrl)}`);
            allArticles.push(...parsedArticles);
          } else {
            console.warn(`No content received from ${this.getFeedName(feedUrl)}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${feedUrl}:`, error);
        }
      }

      // Randomly select articles from all fetched articles
      const selectedArticles = this.shuffleArray(allArticles).slice(0, ARTICLES_PER_PAGE);

      // If we got some articles from RSS, use them, otherwise fall back to mock data
      if (selectedArticles.length > 0) {
        console.log(`Total articles fetched: ${allArticles.length}, selected: ${selectedArticles.length}`);
        console.log('Selected articles sources:', selectedArticles.map(a => a.source));

        // Cache the selected articles
        this.cachedArticles = selectedArticles;
        this.lastFetchTime = now;

        return {
          data: selectedArticles,
          success: true
        };
      }

      console.log('No RSS articles fetched, using mock data');

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

  private parseRSSFeed(xmlText: string, sourceName: string): Article[] {
    const articles: Article[] = [];

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
        return articles;
      }

      // Get all item elements
      const items = xmlDoc.querySelectorAll('item');

      items.forEach((item, index) => {
        const title = item.querySelector('title')?.textContent?.trim();
        const link = item.querySelector('link')?.textContent?.trim();
        const description = item.querySelector('description')?.textContent?.trim();
        const pubDate = item.querySelector('pubDate')?.textContent?.trim();

        // Try to extract image from multiple sources
        const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent;
        const mediaContent = item.querySelector('media\\:content, content')?.getAttribute('url');
        const mediaThumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url');
        const enclosure = item.querySelector('enclosure')?.getAttribute('url');
        let imageUrl = mediaContent || mediaThumbnail;

        // Try to extract image from enclosure (common in RSS feeds)
        if (!imageUrl && enclosure && enclosure.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          imageUrl = enclosure;
        }

        // Try to extract image from description HTML with multiple patterns
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

        // Try to extract image from content:encoded with multiple patterns
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

        // Fallback: use a topic-based placeholder image if no image found
        if (!imageUrl) {
          imageUrl = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        }

        if (title && link && description) {
          articles.push({
            id: `rss-${sourceName}-${index}-${Date.now()}`,
            title: this.cleanText(title),
            excerpt: this.cleanText(description).substring(0, 300) + (description.length > 300 ? '...' : ''),
            url: link,
            source: sourceName,
            publishedDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            imageUrl: imageUrl || undefined,
            sentiment: 'positive',
            tags: ['news', 'positive']
          });
        }
      });
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
    }

    return articles;
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