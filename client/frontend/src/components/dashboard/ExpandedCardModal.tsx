import React, { useEffect } from 'react';
import { dashboardService, type DashboardCard as DashboardCardType, type AggregatedData } from '../../services/dashboardService';
import { Visualization, type VisualizationType } from './VisualizationComponents';
import './ExpandedCardModal.css';

interface ExpandedCardModalProps {
  card: DashboardCardType;
  data: AggregatedData | null;
  onClose: () => void;
}

export const ExpandedCardModal: React.FC<ExpandedCardModalProps> = ({
  card,
  data,
  onClose
}) => {
  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Format time frame display
  const formatTimeFrame = (): string => {
    switch (card.time_frame_type) {
      case 'last_month':
        return 'Last Month';
      case 'this_month_to_date':
        return 'This Month to Date';
      case 'since_installation':
        return 'Since Installation';
      case 'custom':
        if (card.custom_start_date && card.custom_end_date) {
          return `${new Date(card.custom_start_date).toLocaleDateString()} - ${new Date(card.custom_end_date).toLocaleDateString()}`;
        }
        return 'Custom Range';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="expanded-card-modal">
      <div className="expanded-card-modal__overlay" onClick={onClose} />
      <div className="expanded-card-modal__content">
        {/* Header */}
        <div className="expanded-card-modal__header">
          <div className="expanded-card-modal__title-section">
            <h2 className="expanded-card-modal__title">{card.card_name}</h2>
            {card.card_description && (
              <p className="expanded-card-modal__description">{card.card_description}</p>
            )}
          </div>
          <button
            type="button"
            className="expanded-card-modal__close-btn"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Metadata */}
        <div className="expanded-card-modal__metadata">
          <span className="expanded-card-modal__time-frame">📅 {formatTimeFrame()}</span>
          <span className="expanded-card-modal__visualization">📊 {card.visualization_type}</span>
        </div>

        {/* Visualization */}
        <div className="expanded-card-modal__visualization-container">
          {data ? (
            <Visualization
              type={card.visualization_type as VisualizationType}
              data={
                data.grouped_data && Array.isArray(data.grouped_data) && data.grouped_data.length > 0 
                  ? data.grouped_data 
                  : data.aggregated_values
              }
              columns={card.selected_columns}
              height={600}
            />
          ) : (
            <div className="expanded-card-modal__loading">
              <div className="expanded-card-modal__spinner"></div>
              <p>Loading data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
