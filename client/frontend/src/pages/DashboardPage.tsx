import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { DashboardCardModal } from '../components/dashboard/DashboardCardModal';
import { ExpandedCardModal } from '../components/dashboard/ExpandedCardModal';
import { dashboardService, type DashboardCard as DashboardCardType, type AggregatedData } from '../services/dashboardService';
import './DashboardPage.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardPage: React.FC = () => {
  const [cards, setCards] = useState<DashboardCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<DashboardCardType | null>(null);
  const [expandedCard, setExpandedCard] = useState<DashboardCardType | null>(null);
  const [expandedCardData, setExpandedCardData] = useState<AggregatedData | null>(null);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [savingLayout, setSavingLayout] = useState(false);

  // Fetch all dashboard cards
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDashboardCards({
        page: 1,
        limit: 100
      });
      setCards(response.items);
      
      // Initialize layout from card positions
      const newLayout: Layout[] = response.items.map((card, index) => ({
        i: card.dashboard_id.toString(),
        x: card.grid_x ?? (index % 3) * 4,
        y: card.grid_y ?? Math.floor(index / 3) * 5,
        w: card.grid_w ?? 4,
        h: card.grid_h ?? 5,
        static: false,
      }));
      setLayout(newLayout);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch dashboard cards';
      setError(errorMsg);
      console.error('Error fetching dashboard cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Handle global refresh
  const handleGlobalRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    setRefreshing(true);
    try {
      await fetchCards();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle create card button click
  const handleCreateCard = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditingCard(null);
    setShowModal(true);
  };

  // Handle edit card
  const handleEditCard = (card: DashboardCardType) => {
    setEditingCard(card);
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  // Handle modal success
  const handleModalSuccess = (card: DashboardCardType) => {
    if (editingCard) {
      // Update existing card in list
      setCards(cards.map(c => c.dashboard_id === card.dashboard_id ? card : c));
    } else {
      // Add new card to list
      setCards([...cards, card]);
    }
    handleModalClose();
  };

  // Handle layout change
  const handleLayoutChange = async (newLayout: Layout[]) => {
    setLayout(newLayout);
    setSavingLayout(true);

    try {
      // Save layout changes for each card
      const updates = newLayout.map(item => {
        const card = cards.find(c => c.dashboard_id === parseInt(item.i));
        if (card) {
          return dashboardService.updateDashboardCard(card.dashboard_id, {
            grid_x: item.x,
            grid_y: item.y,
            grid_w: item.w,
            grid_h: item.h,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updates);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save layout';
      setError(errorMsg);
      console.error('Error saving layout:', err);
    } finally {
      setSavingLayout(false);
    }
  };

  // Handle delete card
  const handleDeleteCard = async (cardId: number) => {
    try {
      await dashboardService.deleteDashboardCard(cardId);
      setCards(cards.filter(c => c.dashboard_id !== cardId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete card';
      setError(errorMsg);
      console.error('Error deleting card:', err);
    }
  };

  // Handle drill-down
  const handleDrillDown = (cardId: number) => {
    // TODO: Navigate to detailed readings view
    console.log('Drill down for card:', cardId);
  };

  // Handle card refresh
  const handleCardRefresh = (cardId: number) => {
    // Update the card's last_refreshed timestamp by refetching the card
    setCards(cards.map(c => {
      if (c.dashboard_id === cardId) {
        return { ...c, last_refreshed: new Date().toISOString() };
      }
      return c;
    }));
  };

  // Handle expand card
  const handleExpandCard = async (card: DashboardCardType) => {
    setExpandedCard(card);
    try {
      const data = await dashboardService.getCardData(card.dashboard_id);
      setExpandedCardData(data);
    } catch (err) {
      console.error('Error fetching expanded card data:', err);
      setExpandedCardData(null);
    }
  };

  // Handle close expanded card
  const handleCloseExpandedCard = () => {
    setExpandedCard(null);
    setExpandedCardData(null);
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-page__header">
        <div className="dashboard-page__title-section">
          <h1 className="dashboard-page__title">Dashboard</h1>
        </div>
        <div className="dashboard-page__header-actions">
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--primary"
            onClick={handleCreateCard}
            title="Create a new dashboard card"
          >
            ➕ Create Card
          </button>
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--secondary"
            onClick={handleGlobalRefresh}
            disabled={refreshing}
            title="Refresh all cards"
          >
            {refreshing ? (
              <>
                <span className="dashboard-page__spinner">⟳</span>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="dashboard-page__error-banner">
          <p>{error}</p>
          <button
            type="button"
            className="dashboard-page__error-close"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-spinner"></div>
          <p>Loading dashboard cards...</p>
        </div>
      ) : cards.length === 0 ? (
        /* Empty State */
        <div className="dashboard-page__empty">
          <div className="dashboard-page__empty-icon">📊</div>
          <h2 className="dashboard-page__empty-title">No Dashboard Cards Yet</h2>
          <p className="dashboard-page__empty-description">
            Create your first dashboard card to start monitoring your energy metrics.
          </p>
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--primary"
            onClick={handleCreateCard}
          >
            ➕ Create Your First Card
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <ResponsiveGridLayout
          className="dashboard-page__cards-grid"
          layouts={{ lg: layout }}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          width={1200}
          isDraggable={!savingLayout}
          isResizable={!savingLayout}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
        >
          {cards.map((card) => (
            <div key={card.dashboard_id.toString()} className="dashboard-page__card-wrapper">
              <DashboardCard
                card={card}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
                onDrillDown={handleDrillDown}
                onRefresh={handleCardRefresh}
                onExpand={handleExpandCard}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Dashboard Card Modal */}
      <DashboardCardModal
        isOpen={showModal}
        card={editingCard}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Expanded Card Modal */}
      {expandedCard && (
        <ExpandedCardModal
          card={expandedCard}
          data={expandedCardData}
          onClose={handleCloseExpandedCard}
        />
      )}
    </div>
  );
};
