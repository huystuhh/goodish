import React from 'react';
import { useArticleStore } from '../store/useArticleStore';

export const Navigation: React.FC = () => {
  const { nextBatch, isLoading } = useArticleStore();

  const handleNextBatch = async () => {
    await nextBatch();
  };

  return (
    <div className="navigation">
      <button
        onClick={handleNextBatch}
        className="nav-btn"
        aria-label="Load next batch of articles"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'More Goodish'}
      </button>

      <div className="keyboard-hint">
        <span>or just press space.</span>
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