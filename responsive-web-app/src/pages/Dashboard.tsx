import React, { useState, useEffect } from 'react';
import { MeterReadingsList } from '../components/dashboard';
import { meterReadingService } from '../services';
import type { MeterReadingStats } from '../types/entities';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<MeterReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(true);

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
    
    // Set up auto-refresh for stats every 30 seconds
    const statsInterval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 seconds
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  // Format large numbers
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
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

      {/* Statistics Section - Collapsible */}
      <div className="dashboard__stats-section">
        <div className="dashboard__stats-header" onClick={() => setStatsExpanded(!statsExpanded)}>
          <h2 className="dashboard__stats-title">
            <span className="dashboard__stats-icon">📊</span>
            Meter Statistics
          </h2>
          <button 
            type="button" 
            className={`dashboard__collapse-btn ${statsExpanded ? 'dashboard__collapse-btn--expanded' : ''}`}
            aria-label={statsExpanded ? 'Collapse statistics' : 'Expand statistics'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className={`dashboard__stats-content ${statsExpanded ? 'dashboard__stats-content--expanded' : ''}`}>
          <div className="dashboard__stats">
            {loading ? (
              <div className="dashboard__stats-loading">
                <div className="dashboard__spinner"></div>
                <p>Loading statistics...</p>
              </div>
            ) : error ? (
              <div className="dashboard__stats-error">
                <p>Error loading statistics: {error}</p>
                <button type="button" onClick={fetchStats} className="dashboard__retry-btn">
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
                <p className="dashboard__stat-value">{stats.avgVoltage ? stats.avgVoltage.toFixed(1) : '--'} V</p>
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
                <p className="dashboard__stat-value">{stats.avgPowerFactor ? (stats.avgPowerFactor * 100).toFixed(1) : '--'}%</p>
                <p className="dashboard__stat-subtitle">System efficiency</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--current">
              <div className="dashboard__stat-icon">🔄</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Avg Current</h3>
                <p className="dashboard__stat-value">{stats.avgCurrent ? stats.avgCurrent.toFixed(1) : '--'} A</p>
                <p className="dashboard__stat-subtitle">System load</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--reactive">
              <div className="dashboard__stat-icon">🔋</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Reactive Power</h3>
                <p className="dashboard__stat-value">{formatNumber(stats.avgTotalReactivePower)} kVAR</p>
                <p className="dashboard__stat-subtitle">Average reactive</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--apparent">
              <div className="dashboard__stat-icon">⚡</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Apparent Power</h3>
                <p className="dashboard__stat-value">{formatNumber(stats.avgTotalApparentPower)} kVA</p>
                <p className="dashboard__stat-subtitle">Average apparent</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--temperature">
              <div className="dashboard__stat-icon">🌡️</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Temperature</h3>
                <p className="dashboard__stat-value">{stats.avgTemperature ? stats.avgTemperature.toFixed(1) : '--'} °C</p>
                <p className="dashboard__stat-subtitle">System average</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--thd">
              <div className="dashboard__stat-icon">📊</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Voltage THD</h3>
                <p className="dashboard__stat-value">{stats.avgVoltageThd ? stats.avgVoltageThd.toFixed(2) : '--'}%</p>
                <p className="dashboard__stat-subtitle">Power quality</p>
              </div>
            </div>

            <div className="dashboard__stat-card dashboard__stat-card--demand">
              <div className="dashboard__stat-icon">📈</div>
              <div className="dashboard__stat-content">
                <h3 className="dashboard__stat-title">Max Demand</h3>
                <p className="dashboard__stat-value">{formatNumber(stats.maxDemandKW)} kW</p>
                <p className="dashboard__stat-subtitle">Peak demand</p>
              </div>
            </div>
            </>
          ) : null}
          </div>
        </div>
      </div>

      {/* Latest Meter Readings */}
      <div className="dashboard__content">
        <MeterReadingsList 
          className="dashboard__meter-readings"
          maxItems={50}
        />
      </div>
    </div>
  );
};