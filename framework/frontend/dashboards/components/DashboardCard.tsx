/**
 * DashboardCard Component
 * 
 * Generic dashboard card component that displays aggregated meter data with controls.
 * This component is framework-level and contains no API calls or business logic.
 * All data and callbacks are provided through props.
 */

import React, { useState, useEffect } from 'react';
import type { DashboardCard as DashboardCardType, AggregatedData, VisualizationType } from '../types';
import {
  Card,
  CardContent,
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmailIcon from '@mui/icons-material/Email';
import './DashboardCard.css';

/**
 * Props for DashboardCard component
 */
export interface DashboardCardProps {
  /** Card configuration */
  card: DashboardCardType;
  /** Aggregated data for the card */
  data: AggregatedData | null;
  /** Loading state */
  loading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Callback when edit button is clicked */
  onEdit?: (card: DashboardCardType) => void;
  /** Callback when delete button is clicked */
  onDelete?: (cardId: string | number) => void;
  /** Callback when refresh button is clicked */
  onRefresh?: (cardId: string | number) => void;
  /** Callback when expand button is clicked */
  onExpand?: (card: DashboardCardType) => void;
  /** Callback when visualization type changes */
  onVisualizationChange?: (cardId: string | number, newType: VisualizationType) => void;
  /** Callback when grouping type changes */
  onGroupingChange?: (cardId: string | number, newGrouping: string) => void;
  /** Callback when time frame changes */
  onTimeFrameChange?: (cardId: string | number, newTimeFrame: string) => void;
  /** Visualization component to render */
  VisualizationComponent?: React.ComponentType<any>;
  /** Custom className */
  className?: string;
  /** Whether the card is saving */
  isSaving?: boolean;
}

/**
 * Generic dashboard card component
 * 
 * Displays a card with:
 * - Title and description
 * - Action buttons (edit, delete, refresh, expand)
 * - Metadata selectors (time frame, visualization, grouping)
 * - Visualization and aggregated values
 * 
 * @example
 * ```tsx
 * <DashboardCard
 *   card={cardData}
 *   data={aggregatedData}
 *   loading={isLoading}
 *   error={errorMessage}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onRefresh={handleRefresh}
 *   onExpand={handleExpand}
 *   onVisualizationChange={handleVisualizationChange}
 *   VisualizationComponent={Visualization}
 * />
 * ```
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  card,
  data,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRefresh,
  onExpand,
  onVisualizationChange,
  onGroupingChange,
  onTimeFrameChange,
  VisualizationComponent,
  className = '',
  isSaving = false,
}) => {
  const theme = useTheme();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Update last refreshed time when data changes
  useEffect(() => {
    if (data && !loading) {
      setLastRefreshed(new Date());
    }
  }, [data, loading]);

  // Handle refresh button click
  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    onRefresh?.(card.id);
  };

  // Handle edit button click
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit?.(card);
  };

  // Handle expand button click
  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    onExpand?.(card);
  };

  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete "${card.title}"?`)) {
      onDelete?.(card.id);
    }
  };

  // Handle export button click
  const handleExportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!data || !data.aggregated_values) {
      alert('No data available to export');
      return;
    }

    try {
      // Generate CSV from aggregated values
      const headers = Object.keys(data.aggregated_values);
      const csvContent = [
        headers.join(','),
        headers.map(header => data.aggregated_values[header]).join(',')
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const cardName = (card as any).card_name || card.title || 'export';
      link.setAttribute('href', url);
      link.setAttribute('download', `${cardName}-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  // Handle email button click
  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!data || !data.aggregated_values) {
      alert('No data available to email');
      return;
    }

    try {
      // Generate CSV from aggregated values
      const headers = Object.keys(data.aggregated_values);
      const csvContent = [
        headers.join(','),
        headers.map(header => data.aggregated_values[header]).join(',')
      ].join('\n');

      // Create base64 encoded content
      const fileBase64 = btoa(unescape(encodeURIComponent(csvContent)));
      
      const timestamp = new Date().toISOString().split('T')[0];
      const cardName = (card as any).card_name || card.title || 'export';
      const filename = `${cardName}-${timestamp}.csv`;

      // Get auth token from localStorage
      const token = localStorage.getItem('token');

      // Send to backend email endpoint with JSON body
      fetch('/api/emails/send-with-attachment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `Dashboard Export - ${cardName} (${timestamp})`,
          body: `Please find the attached dashboard export file: ${filename}`,
          filename: filename,
          fileBase64: fileBase64
        })
      })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            alert('Email sent successfully');
          } else {
            alert('Failed to send email: ' + (result.message || 'Unknown error'));
          }
        })
        .catch(err => {
          console.error('Email error:', err);
          alert('Failed to send email');
        });
    } catch (err) {
      console.error('Email error:', err);
      alert('Failed to prepare email');
    }
  };

  // Handle visualization change
  const handleVisualizationChange = (e: any) => {
    const newType = e.target.value as VisualizationType;
    onVisualizationChange?.(card.id, newType);
  };

  // Handle grouping change
  const handleGroupingChange = (e: any) => {
    const newGrouping = e.target.value;
    onGroupingChange?.(card.id, newGrouping);
  };

  // Handle time frame change
  const handleTimeFrameChange = (e: any) => {
    const newTimeFrame = e.target.value;
    onTimeFrameChange?.(card.id, newTimeFrame);
  };

  // Format number with commas
  const formatNumber = (value: number | null | undefined | string | object): string => {
    if (value === null || value === undefined) {
      return '--';
    }

    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
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

  // Get visualization type from card
  const currentVisualization = (card.visualization_type || 'line') as VisualizationType;

  // Get grouping type from card (client-specific property)
  const groupingType = (card as any).grouping_type || 'daily';

  // Get time frame type from card (client-specific property)
  const timeFrameType = (card as any).time_frame_type || 'last_month';

  // Get selected columns from card (client-specific property)
  const selectedColumns = (card as any).selected_columns || [];

  // Get card title
  const cardTitle = (card as any).card_name || card.title || 'Untitled Card';

  // Get card description
  const cardDescription = (card as any).card_description || card.description;

  return (
    <Card
      className={`dashboard-card ${className}`}
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
      {/* Card Header with Action Buttons at Top */}
      <Box sx={{ px: 1.5, pt: 1, pb: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
        {/* Drag Handle Icon */}
        <Box
          className="dashboard-card__drag-handle"
          sx={{
            cursor: 'grab',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '&:hover': {
              color: '#666',
            },
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: '1.2rem' }} />
        </Box>

        {/* Action Buttons Row - Right Justified */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
          <Button
            size="small"
            variant="text"
            startIcon={<FullscreenIcon />}
            onClick={handleExpand}
            title="Expand to fullscreen"
            aria-label="Expand"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
          <Button
            size="small"
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || isSaving}
            title="Refresh card data"
            aria-label="Refresh"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
          <Typography
            variant="caption"
            title={lastRefreshed?.toLocaleString()}
            sx={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}
          >
            {formatLastRefreshed()}
          </Typography>
          {/* Export Button */}
          <Button
            size="small"
            variant="text"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportClick}
            title="Export to CSV"
            aria-label="Export to CSV"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
          {/* Email Button */}
          <Button
            size="small"
            variant="text"
            startIcon={<EmailIcon />}
            onClick={handleEmailClick}
            title="Email readings"
            aria-label="Email readings"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
          <Button
            size="small"
            variant="text"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            title="Edit card"
            aria-label="Edit"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
          <Button
            size="small"
            variant="text"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            title="Delete card"
            aria-label="Delete"
            sx={{ minWidth: 'auto', p: 0.5 }}
          />
        </Box>
      </Box>

      {/* Title and Description */}
      <Box sx={{ px: 1.5, pb: 0.75 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {cardTitle}
        </Typography>
        {cardDescription && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.8rem' }}>
            {cardDescription}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Metadata Section */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : '#f5f5f5',
        }}
      >
        {/* Time Frame Selector */}
        {onTimeFrameChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Select
              value={timeFrameType}
              onChange={handleTimeFrameChange}
              disabled={isSaving || loading}
              size="small"
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.75rem',
                backgroundColor: 'white',
                border: '1.5px solid #999',
                borderRadius: '4px',
                color: '#333',
                fontWeight: 500,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: '#fafafa',
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}22`,
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                  borderColor: '#ddd',
                },
              }}
            >
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="this_month_to_date">This Month to Date</MenuItem>
              <MenuItem value="since_installation">Since Installation</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </Box>
        )}

        {/* Visualization Selector */}
        {onVisualizationChange && (
          <Box ref={menuRef} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Select
              value={currentVisualization}
              onChange={handleVisualizationChange}
              disabled={isSaving || loading}
              size="small"
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.75rem',
                backgroundColor: 'white',
                border: '1.5px solid #999',
                borderRadius: '4px',
                color: '#333',
                fontWeight: 500,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: '#fafafa',
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}22`,
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                  borderColor: '#ddd',
                },
              }}
            >
              {(['pie', 'line', 'bar', 'area', 'candlestick'] as VisualizationType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}

        {/* Grouping Selector */}
        {onGroupingChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Select
              value={groupingType}
              onChange={handleGroupingChange}
              disabled={isSaving || loading}
              size="small"
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.75rem',
                backgroundColor: 'white',
                border: '1.5px solid #999',
                borderRadius: '4px',
                color: '#333',
                fontWeight: 500,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: '#fafafa',
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}22`,
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                  borderColor: '#ddd',
                },
              }}
            >
              <MenuItem value="total">Total</MenuItem>
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Card Content */}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'auto', p: 1 }}>
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
              onClick={handleRefresh}
              sx={{ alignSelf: 'center' }}
            >
              Retry
            </Button>
          </Box>
        ) : data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
            {/* Visualization */}
            {VisualizationComponent && (
              <Paper
                sx={{
                  width: '100%',
                  flex: 1,
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1,
                }}
                elevation={0}
              >
                <VisualizationComponent
                  type={currentVisualization}
                  data={
                    data.grouped_data && Array.isArray(data.grouped_data) && data.grouped_data.length > 0
                      ? data.grouped_data
                      : data.aggregated_values
                  }
                  columns={selectedColumns}
                  height={300}
                />
              </Paper>
            )}

            {/* Aggregated Values */}
            {selectedColumns && selectedColumns.length > 0 && (
              <Grid container spacing={0.5} sx={{ justifyContent: 'center', flexShrink: 0 }}>
                {selectedColumns.map((column: string) => (
                  <Grid item xs={12} sm={6} md={4} key={column}>
                    <Paper
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#fafafa',
                      }}
                      elevation={0}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        Totals
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
            )}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};
