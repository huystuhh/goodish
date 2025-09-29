import React from 'react';
import { LOADING_JOKES } from '../constants';

export const LoadingSpinner: React.FC = () => {
  const randomJoke = React.useMemo(() => {
    return LOADING_JOKES[Math.floor(Math.random() * LOADING_JOKES.length)];
  }, []);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div className="loading-joke">
        <p className="loading-text">{randomJoke}</p>
      </div>
    </div>
  );
};