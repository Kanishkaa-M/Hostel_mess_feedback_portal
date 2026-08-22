import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating, onChange, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index) => {
    if (onChange) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (onChange) setHoverRating(0);
  };

  const handleClick = (index) => {
    if (onChange) onChange(index);
  };

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = hoverRating ? index <= hoverRating : index <= rating;

        return (
          <button
            key={index}
            type="button"
            className={`star-btn ${isFilled ? 'filled' : ''}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            disabled={!onChange}
            style={{ cursor: onChange ? 'pointer' : 'default' }}
          >
            <Star
              size={size}
              fill={isFilled ? 'var(--warning)' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
};
