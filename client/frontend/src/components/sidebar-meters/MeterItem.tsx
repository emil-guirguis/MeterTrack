import React, { useState } from 'react';
import type { MeterItemProps } from './types';
import './MeterItem.css';

/**
 * MeterItem Component
 * Renders a single meter with expand/collapse and favorite toggle
 */
export const MeterItem: React.FC<MeterItemProps> = ({
  meter,
  isFavorite,
  isExpanded,
  isSelected,
  onExpand,
  onSelect,
  onFavoriteToggle,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={`meter-item ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="meter-item-content" onClick={onSelect}>
        {/* Expand/Collapse Arrow */}
        <button
          className={`expand-button ${isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label={isExpanded ? 'Collapse meter' : 'Expand meter'}
        >
          ▶
        </button>

        {/* Favorite Indicator */}
        {isFavorite && <span className="favorite-indicator">★</span>}

        {/* Meter Name */}
        <span className="meter-name">{meter.name}</span>
      </div>

      {/* Favorite Toggle Button (visible on hover) */}
      {isHovering && (
        <button
          className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  );
};
