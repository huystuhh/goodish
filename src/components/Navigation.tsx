import React from 'react';
import { useArticleStore } from '../store/useArticleStore';

export const Navigation: React.FC = () => {
  const { nextBatch, isLoading } = useArticleStore();

  const handleNextBatch = async () => {
    await nextBatch();
  };

  return (
    <div
      className={`floating-nav ${isLoading ? 'loading' : ''}`}
      onClick={!isLoading ? handleNextBatch : undefined}
      role="button"
      tabIndex={0}
      aria-label="Load next batch of articles"
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
          e.preventDefault();
          handleNextBatch();
        }
      }}
    >
      <div className="floating-nav-text">
        {isLoading ? 'Loading...' : (
          <>
            <span className="desktop-text">Click here for more Goodish</span>
            <span className="mobile-text">Tap here for more Goodish</span>
          </>
        )}
      </div>

      <div className="floating-nav-hint">
        <span>or press space</span>
      </div>
    </div>
  );
};

// Add keyboard navigation
export const useKeyboardNavigation = () => {
  const { nextBatch, isLoading } = useArticleStore();

  React.useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (event.key === ' ' && !isLoading) {
        event.preventDefault();
        await nextBatch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextBatch, isLoading]);
};