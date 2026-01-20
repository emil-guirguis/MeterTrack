import React, { useState, useEffect } from 'react';
import { dashboardService, type DashboardCard as DashboardCardType, type AggregatedData } from '../../services/dashboardService';
import { Visualization, type VisualizationType } from './VisualizationComponents';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import './DashboardCard.css';

interface DashboardCardProps {
  card: DashboardCardType;
  onEdit?: (card: DashboardCardType) => void;
  onDelete?: (cardId: number) => void;
  onDrillDown?: (cardId: number) => void;
  onRefresh?: (cardId: number) => void;
  onExpand?: (card: DashboardCardType) => void;
  onVisualizationChange?: (cardId: number, newType: VisualizationType) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  card,
  onEdit,
  onDelete,
  onDrillDown,
  onRefresh,
  onExpand,
  onVisualizationChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [groupingType, setGroupingType] = useState<'total' | 'hourly' | 'daily' | 'weekly' | 'monthly'>(
    (card.grouping_type as 'total' | 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationType>(
    (card.visualization_type as VisualizationType) || 'line'
  );
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fetch aggregated data for the card
  const fetchCardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const aggregatedData = await dashboardService.getCardData(card.dashboard_id);
      setData(aggregatedData);
      setLastRefreshed(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch card data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCardData();
  }, [card.dashboard_id]);

  // Handle click outside visualization menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowVisualizationMenu(false);
      }
    };

    if (showVisualizationMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showVisualizationMenu]);

  // Handle refresh button click
  // @ts-ignore - Used in JSX
  const handleRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetchCardData();
    onRefresh?.(card.dashboard_id);
  };

  const handleGroupingChange = async (e: any) => {
    const newGrouping = e.target.value as 'total' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    setGroupingType(newGrouping);
    setIsSaving(true);

    try {
      // Update the card with new grouping type
      await dashboardService.updateDashboardCard(card.dashboard_id, {
        grouping_type: newGrouping
      });
      
      // Update the card object with the new grouping type
      card.grouping_type = newGrouping;
      
      // Refresh data with new grouping
      await fetchCardData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update grouping';
      setError(errorMsg);
      // Revert to previous grouping on error
      setGroupingType((card.grouping_type as 'total' | 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeFrameChange = async (e: any) => {
    const newTimeFrame = e.target.value as 'custom' | 'last_month' | 'this_month_to_date' | 'since_installation';
    setIsSaving(true);

    try {
      // Update the card with new time frame type
      await dashboardService.updateDashboardCard(card.dashboard_id, {
        time_frame_type: newTimeFrame
      });
      
      // Update the card object with the new time frame type
      card.time_frame_type = newTimeFrame;
      
      // Refresh data with new time frame
      await fetchCardData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update time frame';
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisualizationChange = async (newType: VisualizationType) => {
    const previousType = currentVisualization;
    setCurrentVisualization(newType);
    setShowVisualizationMenu(false);
    setIsSaving(true);

    try {
      // Update the card with new visualization type
      await dashboardService.updateDashboardCard(card.dashboard_id, {
        visualization_type: newType
      });
      
      // Update the card object with the new visualization type
      card.visualization_type = newType;
      
      // Notify parent component if callback provided
      onVisualizationChange?.(card.dashboard_id, newType);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update visualization';
      setError(errorMsg);
      // Revert to previous visualization on error
      setCurrentVisualization(previousType);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit button click
  // @ts-ignore - Used in JSX
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(card);
  };

  // Handle expand button click
  // @ts-ignore - Used in JSX
  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    onExpand?.(card);
  };

  // Handle delete button click
  // @ts-ignore - Used in JSX
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete "${card.card_name}"?`)) {
      onDelete?.(card.dashboard_id);
    }
  };

  // Handle drill-down link click
  // @ts-ignore - Used in JSX
  const handleDrillDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDrillDown?.(card.dashboard_id);
  };

  // Get label for visualization type
  const getVisualizationLabel = (type: VisualizationType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format number with commas
  const formatNumber = (value: number | null | undefined | string | object): string => {
    if (value === null || value === undefined) {
      return '--';
    }
    
    // Convert to number if it's a string
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
      // For objects or other types, return '--'
      return '--';
    }
    
    if (isNaN(numValue)) {
      return '--';
    }
    
    return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format last refreshed time
  const formatLastRefreshed = (): string => {
    if (!lastRefreshed) {
      return 'Never';
    }
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return lastRefreshed.toLocaleDateString();
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {/* Card Header with Title and Actions */}
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {card.card_name}
          </Typography>
        }
        subheader={
          card.card_description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {card.card_description}
            </Typography>
          )
        }
        action={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<FullscreenIcon />}
              onClick={(e) => {
                e.preventDefault();
                onExpand?.(card);
              }}
              title="Expand to fullscreen"
              aria-label="Expand"
            />
            <Button
              size="small"
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={(e) => {
                e.preventDefault();
                fetchCardData();
                onRefresh?.(card.dashboard_id);
              }}
              disabled={loading}
              title="Refresh card data"
              aria-label="Refresh"
            />
            <Button
              size="small"
              variant="text"
              startIcon={<EditIcon />}
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(card);
              }}
              title="Edit card"
              aria-label="Edit"
            />
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm(`Are you sure you want to delete "${card.card_name}"?`)) {
                  onDelete?.(card.dashboard_id);
                }
              }}
              title="Delete card"
              aria-label="Delete"
            />
          </Box>
        }
        sx={{
          pb: 1,
          '& .MuiCardHeader-action': {
            mt: 0,
            mr: 0,
          },
        }}
      />

      <Divider />

      {/* Metadata Section */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : '#f5f5f5',
        }}
      >
        {/* Time Frame Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">📅 Time Frame:</Typography>
          <Select
            value={card.time_frame_type}
            onChange={handleTimeFrameChange}
            disabled={isSaving}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="last_month">Last Month</MenuItem>
            <MenuItem value="this_month_to_date">This Month to Date</MenuItem>
            <MenuItem value="since_installation">Since Installation</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </Box>

        {/* Visualization Selector */}
        <Box ref={menuRef} sx={{ display: 'flex', alignItems: 'center' }}>
          <Select
            value={currentVisualization}
            onChange={(e) => handleVisualizationChange(e.target.value as VisualizationType)}
            disabled={isSaving}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {(['pie', 'line', 'bar', 'area', 'candlestick'] as VisualizationType[]).map((type) => (
              <MenuItem key={type} value={type}>
                {getVisualizationLabel(type)}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Grouping Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">📈 Group by:</Typography>
          <Select
            value={groupingType}
            onChange={handleGroupingChange}
            disabled={isSaving || loading}
            size="small"
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="total">Total</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </Box>

        <Typography
          variant="caption"
          title={lastRefreshed?.toLocaleString()}
          sx={{ ml: 'auto' }}
        >
          🔄 {formatLastRefreshed()}
        </Typography>
      </Box>

      <Divider />

      {/* Card Content */}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading data...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="error">{error}</Alert>
            <Button
              variant="contained"
              onClick={fetchCardData}
              sx={{ alignSelf: 'center' }}
            >
              Retry
            </Button>
          </Box>
        ) : data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {/* Visualization */}
            <Paper
              sx={{
                width: '100%',
                height: 250,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
              }}
              elevation={0}
            >
              <Visualization
                type={card.visualization_type as VisualizationType}
                data={
                  data.grouped_data && Array.isArray(data.grouped_data) && data.grouped_data.length > 0
                    ? data.grouped_data
                    : data.aggregated_values
                }
                columns={card.selected_columns}
                height={250}
              />
            </Paper>

            {/* Aggregated Values */}
            <Grid container spacing={1}>
              {card.selected_columns.map((column) => (
                <Grid item xs={12} sm={6} md={4} key={column}>
                  <Paper
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#fafafa',
                    }}
                    elevation={0}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                      {column}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        mt: 0.5,
                      }}
                    >
                      {formatNumber(data.aggregated_values[column])}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Daily Totals */}
            {data.daily_values && data.daily_values.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Daily Totals
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {data.daily_values.map((dayData, index) => (
                    <Box key={dayData.date}>
                      {index > 0 && <Divider sx={{ my: 1 }} />}
                      <Box sx={{ py: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {new Date(dayData.date).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                          {card.selected_columns.map((column) => (
                            <Typography key={`${dayData.date}-${column}`} variant="caption" color="text.secondary">
                              {column}: {formatNumber(dayData[column])}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Drill-down Link */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button
                fullWidth={isMobile}
                variant="text"
                onClick={(e) => {
                  e.preventDefault();
                  onDrillDown?.(card.dashboard_id);
                }}
              >
                View Detailed Readings →
              </Button>
            </Box>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};
