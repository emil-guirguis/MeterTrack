import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout';
import { DataTable } from '../components/common/DataTable';
import { meterReadingService } from '../services';
import type { DetailedMeterReading } from '../types/entities';
import './MeterReadingsPage.css';

export const MeterReadingsPage: React.FC = () => {
  const [readings, setReadings] = useState<DetailedMeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    meterId: '',
    quality: '' as '' | 'good' | 'estimated' | 'questionable',
    sortBy: 'timestamp',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Fetch meter readings with current filters and pagination
  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.meterId && { meterId: filters.meterId }),
        ...(filters.quality && { quality: filters.quality })
      };

      const data = await meterReadingService.getMeterReadings(params);
      setReadings(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
        hasMore: data.hasMore
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meter readings');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };



  // Format functions
  const formatPowerFactor = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatValue = (value: number, unit: string, decimals: number = 1): string => {
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const getQualityIndicator = (quality: string): string => {
    switch (quality) {
      case 'good': return '✅';
      case 'estimated': return '⚠️';
      case 'questionable': return '❌';
      default: return '❓';
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'meterId',
      label: 'Meter ID',
      sortable: true,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings-page__meter-cell">
          <div className="meter-readings-page__meter-id">{reading.meterId}</div>
          <div className="meter-readings-page__meter-ip">{reading.ip}:{reading.port}</div>
        </div>
      )
    },
    {
      key: 'kWh',
      label: 'Energy (kWh)',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings-page__energy">
          {formatValue(reading.kWh, 'kWh', 2)}
        </span>
      )
    },
    {
      key: 'kW',
      label: 'Power (kW)',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings-page__power-cell">
          <div className="meter-readings-page__current-power">{formatValue(reading.kW, 'kW', 2)}</div>
          <div className="meter-readings-page__peak-power">Peak: {formatValue(reading.kWpeak, 'kW', 2)}</div>
        </div>
      )
    },
    {
      key: 'kVAh',
      label: 'Apparent Energy',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings-page__kva">
          {formatValue(reading.kVAh, 'kVAh', 2)}
        </span>
      )
    },
    {
      key: 'kVARh',
      label: 'Reactive Energy',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings-page__kvar">
          {formatValue(reading.kVARh, 'kVARh', 2)}
        </span>
      )
    },
    {
      key: 'V',
      label: 'Voltage',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings-page__voltage">
          {formatValue(reading.V, 'V', 1)}
        </span>
      )
    },
    {
      key: 'A',
      label: 'Current',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings-page__current">
          {formatValue(reading.A, 'A', 2)}
        </span>
      )
    },
    {
      key: 'dPF',
      label: 'Power Factor',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings-page__pf-cell">
          <div className="meter-readings-page__pf-value">{formatPowerFactor(reading.dPF)}</div>
          <div className="meter-readings-page__pf-channel">Ch: {reading.dPFchannel}</div>
        </div>
      )
    },
    {
      key: 'quality',
      label: 'Quality',
      sortable: true,
      align: 'center' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings-page__quality-cell">
          <span className="meter-readings-page__quality-indicator">
            {getQualityIndicator(reading.quality)}
          </span>
          <span className="meter-readings-page__quality-text">
            {reading.quality.charAt(0).toUpperCase() + reading.quality.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings-page__timestamp-cell">
          <div className="meter-readings-page__date">
            {new Date(reading.timestamp).toLocaleDateString()}
          </div>
          <div className="meter-readings-page__time">
            {new Date(reading.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ];

  return (
    <AppLayout title="Meter Readings">
      <div className="meter-readings-page">
        <div className="meter-readings-page__header">
          <h1 className="meter-readings-page__title">Meter Readings</h1>
          <p className="meter-readings-page__subtitle">
            Real-time energy consumption and electrical parameters
          </p>
        </div>

        {/* Filters */}
        <div className="meter-readings-page__filters">
          <div className="meter-readings-page__filter-group">
            <label htmlFor="meterId" className="meter-readings-page__filter-label">
              Meter ID:
            </label>
            <input
              id="meterId"
              type="text"
              className="meter-readings-page__filter-input"
              placeholder="Filter by meter ID..."
              value={filters.meterId}
              onChange={(e) => handleFilterChange('meterId', e.target.value)}
            />
          </div>

          <div className="meter-readings-page__filter-group">
            <label htmlFor="quality" className="meter-readings-page__filter-label">
              Quality:
            </label>
            <select
              id="quality"
              className="meter-readings-page__filter-select"
              value={filters.quality}
              onChange={(e) => handleFilterChange('quality', e.target.value)}
            >
              <option value="">All Qualities</option>
              <option value="good">Good</option>
              <option value="estimated">Estimated</option>
              <option value="questionable">Questionable</option>
            </select>
          </div>

          <button
            className="meter-readings-page__refresh-btn"
            onClick={fetchReadings}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Data Table */}
        <div className="meter-readings-page__content">
          <DataTable
            data={readings}
            columns={columns}
            loading={loading}
            error={error || undefined}
            striped
            hoverable
            emptyMessage="No meter readings found"
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="meter-readings-page__pagination">
              <div className="meter-readings-page__pagination-info">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} readings
              </div>
              
              <div className="meter-readings-page__pagination-controls">
                <button
                  className="meter-readings-page__pagination-btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  Previous
                </button>
                
                <span className="meter-readings-page__pagination-current">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  className="meter-readings-page__pagination-btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};