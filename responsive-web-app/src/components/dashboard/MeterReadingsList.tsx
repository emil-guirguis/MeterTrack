import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '../common/DataTable';
import { meterReadingService } from '../../services';
import type { DetailedMeterReading } from '../../types/entities';
import './MeterReadingsList.css';

interface MeterReadingsListProps {
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
}

export const MeterReadingsList: React.FC<MeterReadingsListProps> = ({
  className = '',
  showTitle = true,
  maxItems = 10
}) => {
  const [readings, setReadings] = useState<DetailedMeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest meter readings
  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meterReadingService.getLatestReadings();
      setReadings(data.slice(0, maxItems));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meter readings');
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Format power factor as percentage
  const formatPowerFactor = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format number with units
  const formatValue = (value: number, unit: string, decimals: number = 1): string => {
    return `${value.toFixed(decimals)} ${unit}`;
  };

  // Get quality indicator
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
        <div className="meter-readings__meter-cell">
          <div className="meter-readings__meter-id">{reading.meterId}</div>
          <div className="meter-readings__meter-ip">{reading.ip}:{reading.port}</div>
        </div>
      )
    },
    {
      key: 'kWh',
      label: 'Energy (kWh)',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings__energy">
          {formatValue(reading.kWh, 'kWh', 1)}
        </span>
      )
    },
    {
      key: 'kW',
      label: 'Power (kW)',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings__power-cell">
          <div className="meter-readings__current-power">{formatValue(reading.kW, 'kW', 1)}</div>
          <div className="meter-readings__peak-power">Peak: {formatValue(reading.kWpeak, 'kW', 1)}</div>
        </div>
      )
    },
    {
      key: 'V',
      label: 'Voltage',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <span className="meter-readings__voltage">
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
        <span className="meter-readings__current">
          {formatValue(reading.A, 'A', 1)}
        </span>
      )
    },
    {
      key: 'dPF',
      label: 'Power Factor',
      sortable: true,
      align: 'right' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings__pf-cell">
          <div className="meter-readings__pf-value">{formatPowerFactor(reading.dPF)}</div>
          <div className="meter-readings__pf-channel">Ch: {reading.dPFchannel}</div>
        </div>
      )
    },
    {
      key: 'quality',
      label: 'Quality',
      sortable: true,
      align: 'center' as const,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings__quality-cell">
          <span className="meter-readings__quality-indicator">
            {getQualityIndicator(reading.quality)}
          </span>
          <span className="meter-readings__quality-text">
            {reading.quality.charAt(0).toUpperCase() + reading.quality.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Last Updated',
      sortable: true,
      render: (reading: DetailedMeterReading) => (
        <div className="meter-readings__timestamp-cell">
          <div className="meter-readings__date">
            {new Date(reading.timestamp).toLocaleDateString()}
          </div>
          <div className="meter-readings__time">
            {new Date(reading.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className={`meter-readings-list ${className}`}>
        {showTitle && <h3 className="meter-readings-list__title">Latest Meter Readings</h3>}
        <div className="meter-readings-list__loading">
          <div className="meter-readings-list__spinner"></div>
          <p>Loading meter readings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`meter-readings-list ${className}`}>
        {showTitle && <h3 className="meter-readings-list__title">Latest Meter Readings</h3>}
        <div className="meter-readings-list__error">
          <p>Error: {error}</p>
          <button 
            className="meter-readings-list__retry-btn"
            onClick={fetchReadings}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`meter-readings-list ${className}`}>
      {showTitle && (
        <div className="meter-readings-list__header">
          <h3 className="meter-readings-list__title">Latest Meter Readings</h3>
          <button 
            className="meter-readings-list__refresh-btn"
            onClick={fetchReadings}
            title="Refresh readings"
          >
            🔄
          </button>
        </div>
      )}
      
      <DataTable
        data={readings}
        columns={columns}
        loading={loading}
        striped
        hoverable
        emptyMessage="No meter readings available"
      />
    </div>
  );
};