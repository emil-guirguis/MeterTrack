import React, { useState, useEffect, useCallback } from 'react';
import { DataList } from '../common/DataList';
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

  // Safe number check
  const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);

  // Format power factor as percentage (safe)
  const formatPowerFactor = (value: any): string => {
    if (!isNum(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format number with units (safe)
  const formatValue = (value: any, unit: string, decimals: number = 1): string => {
    if (!isNum(value)) return '—';
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
        key: 'deviceIP',
        label: 'Device IP',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.deviceIP || reading.ip || ''
      },
      {
        key: 'slaveId',
        label: 'Slave ID',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.slaveId ?? ''
      },
      {
        key: 'source',
        label: 'Source',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.source ?? ''
      },
      {
        key: 'voltage',
        label: 'Voltage (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.voltage ?? ''
      },
      {
        key: 'current',
        label: 'Current (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.current ?? ''
      },
      {
        key: 'power',
        label: 'Power (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.power ?? ''
      },
      {
        key: 'energy',
        label: 'Energy (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.energy ?? ''
      },
      {
        key: 'frequency',
        label: 'Frequency (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.frequency ?? ''
      },
      {
        key: 'powerFactor',
        label: 'Power Factor (modbus)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.powerFactor ?? ''
      },
      {
        key: 'phaseAVoltage',
        label: 'Phase A Voltage',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.phaseAVoltage ?? ''
      },
      {
        key: 'phaseBVoltage',
        label: 'Phase B Voltage',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.phaseBVoltage ?? ''
      },
      {
        key: 'phaseCVoltage',
        label: 'Phase C Voltage',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.phaseCVoltage ?? ''
      },
      {
        key: 'totalActiveEnergyWh',
        label: 'Total Active Energy (Wh)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.totalActiveEnergyWh ?? ''
      },
      {
        key: 'frequencyHz',
        label: 'Frequency (Hz)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.frequencyHz ?? ''
      },
      {
        key: 'temperatureC',
        label: 'Temperature (°C)',
        sortable: true,
        render: (_value: any, reading: DetailedMeterReading) => reading.temperatureC ?? ''
      },
    {
      key: 'meterId',
      label: 'Meter ID',
      sortable: true,
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
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
      render: (_value: any, reading: DetailedMeterReading) => (
        <div className="meter-readings__quality-cell">
          <span className="meter-readings__quality-indicator">
            {getQualityIndicator(reading.quality || 'good')}
          </span>
          <span className="meter-readings__quality-text">
            {(reading.quality || 'good').charAt(0).toUpperCase() + (reading.quality || 'good').slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Last Updated',
      sortable: true,
      render: (_value: any, reading: DetailedMeterReading) => (
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
      <DataList
        title={showTitle ? "Latest Meter Readings" : undefined}
        data={readings}
        columns={columns}
        loading={loading}
        error={error || undefined}
        striped
        hoverable
        emptyMessage="No meter readings available"
        headerActions={
          <button 
            className="meter-readings-list__refresh-btn"
            onClick={fetchReadings}
            title="Refresh readings"
          >
            🔄
          </button>
        }
      />
    </div>
  );
};