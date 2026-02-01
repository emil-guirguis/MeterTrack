import React, { useState, useEffect } from 'react';
import { tokenStorage } from '../../../utils/tokenStorage';
import './RegisterSelector.css';

interface Register {
  register_id: number;
  id?: string;
  name: string;
  number?: string;
  unit?: string;
  field_name?: string;
  description?: string;
  [key: string]: any;
}

interface RegisterSelectorProps {
  value: string[];
  error?: string;
  isDisabled: boolean;
  onChange: (value: string[]) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * RegisterSelector Component
 * 
 * Allows users to select registers for their report.
 * Displays register names and descriptions.
 * 
 * Features:
 * - Loads registers from /api/registers endpoint
 * - Handles API errors gracefully with user-facing messages
 * - Shows loading states during data fetching
 * - Validates token before making API calls
 * - Supports multiple register selection
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5**
 */
export const RegisterSelector: React.FC<RegisterSelectorProps> = ({
  value = [],
  error,
  isDisabled,
  onChange,
}) => {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load available registers on mount
  useEffect(() => {
    const fetchRegisters = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = tokenStorage.getToken();
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }
        headers['Authorization'] = `Bearer ${token}`;

        console.log('[RegisterSelector] Fetching registers from:', `${API_BASE_URL}/registers`);
        const response = await fetch(`${API_BASE_URL}/registers`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view registers.');
          } else if (response.status === 404) {
            throw new Error('Registers endpoint not found.');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[RegisterSelector] Registers response:', data);
        
        // Handle both direct array response and wrapped response
        let registersList: Register[] = [];
        if (Array.isArray(data)) {
          registersList = data;
        } else if (data.success && data.data) {
          if (Array.isArray(data.data)) {
            registersList = data.data;
          }
        }
        
        if (!Array.isArray(registersList)) {
          throw new Error('Invalid response format from registers API');
        }
        
        console.log('[RegisterSelector] Parsed registers:', registersList);
        setRegisters(registersList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load registers';
        console.error('[RegisterSelector] Failed to fetch registers:', err);
        setApiError(errorMessage);
        setRegisters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegisters();
  }, []);

  const handleToggle = (registerId: string) => {
    const newValue = value.includes(registerId)
      ? value.filter(id => id !== registerId)
      : [...value, registerId];

    onChange(newValue);
  };

  return (
    <div className="register-selector">
      {apiError && (
        <div className="form-error">{apiError}</div>
      )}
      {loading ? (
        <div className="register-selector__loading">Loading registers...</div>
      ) : registers.length === 0 ? (
        <div className="register-selector__empty">No registers available</div>
      ) : (
        <div className="register-list">
          {registers.map(register => (
            <label key={register.register_id || register.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={value.includes(String(register.register_id || register.id))}
                onChange={() => handleToggle(String(register.register_id || register.id))}
                disabled={isDisabled}
                className="checkbox-item__input"
              />
              <span className="checkbox-item__label">
                <span className="register-name">{register.name}</span>
                {register.unit && <span className="register-unit">({register.unit})</span>}
                {register.description && (
                  <span className="register-description">{register.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default RegisterSelector;
