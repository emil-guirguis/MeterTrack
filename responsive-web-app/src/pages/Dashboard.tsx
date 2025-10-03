import React, { useState, useEffect } from 'react';
import { MeterReadingsList } from '../components/dashboard';
import { meterReadingService } from '../services';
import type { MeterReadingStats } from '../types/entities';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<MeterReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meterReadingService.getMeterStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format large numbers
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(1);
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Facility Management Dashboard</h1>
        <p className="dashboard__subtitle">Real-time monitoring and energy management</p>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard__stats">
        {loading ? (
          <div className="dashboard__stats-loading">
            <div className="dashboard__spinner"></div>
            <p>Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="dashboard__stats-error">
            <p>Error loading statistics: {error}</p>
            <button onClick={fetchStats} className="dashboard__retry-btn">
              Retry
            </button>
          </div>
        ) : stats ? (
          <>
            <div className="dashboard__stat-card dashboard__stat-card--energy">
              <div className="dashboard__stat-icon">⚡</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Total Energy</h3>
                <p className="dashboard__stat-value">{formatNumber(stats.totalKWh)} kWh</p>
                <p className="dashboard__stat-subtitle">Cumulative consumption</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--power">
              <div className="dashboard__stat-icon">🔌</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Peak Demand</h3>
                <p className="dashboard__stat-value">{formatNumber(stats.maxKWpeak)} kW</p>
                <p className="dashboard__stat-subtitle">Maximum recorded</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--voltage">
              <div className="dashboard__stat-icon">📊</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Avg Voltage</h3>
                <p className="dashboard__stat-value">{stats.avgVoltage.toFixed(1)} V</p>
                <p className="dashboard__stat-subtitle">System average</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--meters">
              <div className="dashboard__stat-icon">📈</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Active Meters</h3>
                <p className="dashboard__stat-value">{stats.uniqueMeters}</p>
                <p className="dashboard__stat-subtitle">{formatNumber(stats.totalReadings)} readings</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--pf">
              <div className="dashboard__stat-icon">⚖️</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Power Factor</h3>
                <p className="dashboard__stat-value">{(stats.avgPowerFactor * 100).toFixed(1)}%</p>
                <p className="dashboard__stat-subtitle">System efficiency</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--current">
              <div className="dashboard__stat-icon">🔄</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Avg Current</h3>
                <p className="dashboard__stat-value">{stats.avgCurrent.toFixed(1)} A</p>
                <p className="dashboard__stat-subtitle">System load</p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Latest Meter Readings */}
      <div className="dashboard__content">
        <MeterReadingsList 
          className="dashboard__meter-readings"
          maxItems={15}
        />
      </div>
    </div>
  );
};