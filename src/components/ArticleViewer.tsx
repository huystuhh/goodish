import React from 'react';
import { useArticleStore } from '../store/useArticleStore';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const handleReadOriginal = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  return (
    <article
      className="article-card clickable-card"
      onClick={handleReadOriginal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleReadOriginal();
        }
      }}
    >
      {article.imageUrl && (
        <div className="article-image">
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="article-content">
        <div className="article-header">
          <h2 className="article-title">{article.title}</h2>

          <div className="article-meta">
            <span className="article-source">{article.source}</span>
            <span className="article-divider">•</span>
            <span className="article-date">{formatDate(article.publishedDate)}</span>
            {/* {article.tags && article.tags.length > 0 && (
              <>
                <span className="article-divider">•</span>
                <div className="article-tags">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="article-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )} */}
          </div>
        </div>

        <div className="article-body">
          <p className="article-excerpt">{article.excerpt}</p>
        </div>

        <div className="article-read-hint">
          <span className="desktop-read-text">Click to read full article</span>
          <span className="mobile-read-text">Tap to read full article</span>
        </div>
      </div>
    </article>
  );
};

export const ArticleViewer: React.FC = () => {
  const { getCurrentBatch } = useArticleStore();
  const articles = getCurrentBatch();

  if (articles.length === 0) {
    return (
      <div className="article-viewer">
        <div className="no-articles">
          <p>No articles available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-viewer">
      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};