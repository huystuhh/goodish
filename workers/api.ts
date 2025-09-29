export interface Env {
  // Add any environment variables here
  OPENAI_API_KEY?: string;
}

interface RSSFeed {
  url: string;
  name: string;
  category: string;
}

interface Article {
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

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Good news RSS feeds
const RSS_FEEDS: RSSFeed[] = [
  {
    url: 'https://www.goodnewsnetwork.org/category/news/feed/',
    name: 'Good News Network',
    category: 'news'
  },
  {
    url: 'https://www.positive.news/feed/',
    name: 'Positive News',
    category: 'general'
  },
  {
    url: 'https://www.optimistdaily.com/feed/',
    name: 'The Optimist Daily',
    category: 'lifestyle'
  },
  {
    url: 'https://www.goodgoodgood.co/articles/rss.xml',
    name: 'Good Good Good',
    category: 'general'
  },
  {
    url: 'https://reasonstobecheerful.world/feed/',
    name: 'Reasons to be Cheerful',
    category: 'lifestyle'
  },
  {
    url: 'https://notallnewsisbad.com/feed/',
    name: 'Not All News is Bad',
    category: 'news'
  },
  {
    url: 'https://feeds.feedburner.com/SunnySkyz',
    name: 'Sunny Skyz',
    category: 'general'
  },
  {
    url: 'https://www.upworthy.com/feeds/feed.rss',
    name: 'Upworthy',
    category: 'social'
  }
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    try {
      if (url.pathname === '/api/articles') {
        const articles = await fetchArticles();
        const response: ApiResponse<Article[]> = {
          data: articles,
          success: true
        };
        return new Response(JSON.stringify(response), {
          headers: corsHeaders,
        });
      }

      if (url.pathname === '/api/feeds') {
        const response: ApiResponse<RSSFeed[]> = {
          data: RSS_FEEDS,
          success: true
        };
        return new Response(JSON.stringify(response), {
          headers: corsHeaders,
        });
      }

      // Health check endpoint
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }), {
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders,
      });

    } catch (error) {
      console.error('Worker error:', error);
      const response: ApiResponse<never> = {
        data: null as never,
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

async function fetchArticles(): Promise<Article[]> {
  const articles: Article[] = [];

  // In a production environment, you would:
  // 1. Fetch from multiple RSS feeds in parallel
  // 2. Parse the XML/RSS content
  // 3. Extract articles with positive sentiment
  // 4. Use AI/ML to filter for good news
  // 5. Cache results in KV storage

  // For now, we'll use a mix of real RSS fetching and fallback data
  try {
    // Attempt to fetch from one RSS feed as an example
    const response = await fetch('https://www.goodnewsnetwork.org/feed/', {
      headers: {
        'User-Agent': 'Goodish News App/1.0',
      },
    });

    if (response.ok) {
      const xmlText = await response.text();
      const parsedArticles = await parseRSSFeed(xmlText, 'Good News Network');
      articles.push(...parsedArticles.slice(0, 3)); // Take first 3 articles
    }
  } catch (error) {
    console.error('Error fetching RSS:', error);
  }

  // Add fallback mock articles to ensure we always have content
  articles.push(...getMockArticles());

  // Sort by date and limit results
  return articles
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 10); // Return top 10 articles
}

async function parseRSSFeed(xmlText: string, sourceName: string): Promise<Article[]> {
  // Simple RSS parsing - in production, use a proper XML parser
  const articles: Article[] = [];

  try {
    // Extract items from RSS using regex (basic implementation)
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
    const items = Array.from(xmlText.matchAll(itemRegex));

    for (const item of items.slice(0, 5)) { // Process first 5 items
      const content = item[1];

      const title = extractTag(content, 'title');
      const link = extractTag(content, 'link');
      const description = extractTag(content, 'description');
      const pubDate = extractTag(content, 'pubDate');

      if (title && link && description) {
        articles.push({
          id: `rss-${Date.now()}-${Math.random()}`,
          title: cleanText(title),
          excerpt: cleanText(description).substring(0, 300) + (description.length > 300 ? '...' : ''),
          url: link,
          source: sourceName,
          publishedDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          sentiment: 'positive', // Assume RSS feeds from good news sources are positive
          tags: ['news', 'positive']
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS:', error);
  }

  return articles;
}

function extractTag(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'is');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function getMockArticles(): Article[] {
  return [
    {
      id: 'mock-1',
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
      id: 'mock-2',
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
      id: 'mock-3',
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
      id: 'mock-4',
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
      id: 'mock-5',
      title: 'Wildlife Conservation Success: Endangered Species Population Triples',
      excerpt: 'Thanks to dedicated conservation efforts and community involvement, the population of a critically endangered species has increased by 300% over the past five years, demonstrating that targeted conservation efforts can create meaningful and lasting change.',
      url: 'https://example.com/wildlife-conservation',
      source: 'Nature Conservation News',
      publishedDate: new Date(Date.now() - 432000000).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=800',
      sentiment: 'positive',
      tags: ['wildlife', 'conservation', 'success story']
    }
  ];
}