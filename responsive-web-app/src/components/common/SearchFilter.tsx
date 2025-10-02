import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SearchFilterProps, AdvancedFilterProps } from '../../types/ui';
import './SearchFilter.css';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Advanced Filter Component
function AdvancedFilter({ filters, values, onChange, onReset }: AdvancedFilterProps) {
  const handleFilterChange = useCallback((key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    });
  }, [values, onChange]);

  const handleClearFilter = useCallback((key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  }, [values, onChange]);

  const activeFiltersCount = Object.keys(values).length;

  return (
    <div className="advanced-filter">
      <div className="advanced-filter__header">
        <h3 className="advanced-filter__title">Advanced Filters</h3>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            className="advanced-filter__reset"
            onClick={onReset}
          >
            Clear All ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="advanced-filter__grid">
        {filters.map((filter) => (
          <div key={filter.key} className="advanced-filter__field">
            <label className="advanced-filter__label">
              {filter.label}
            </label>
            
            {filter.type === 'text' && (
              <div className="advanced-filter__input-group">
                <input
                  type="text"
                  className="advanced-filter__input"
                  placeholder={filter.placeholder}
                  value={values[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
                {values[filter.key] && (
                  <button
                    type="button"
                    className="advanced-filter__clear"
                    onClick={() => handleClearFilter(filter.key)}
                    aria-label={`Clear ${filter.label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {filter.type === 'select' && (
              <div className="advanced-filter__input-group">
                <select
                  className="advanced-filter__select"
                  value={values[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  aria-label={filter.label}
                >
                  <option value="">All {filter.label}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {values[filter.key] && (
                  <button
                    type="button"
                    className="advanced-filter__clear"
                    onClick={() => handleClearFilter(filter.key)}
                    aria-label={`Clear ${filter.label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {filter.type === 'date' && (
              <div className="advanced-filter__input-group">
                <input
                  type="date"
                  className="advanced-filter__input"
                  value={values[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  aria-label={filter.label}
                />
                {values[filter.key] && (
                  <button
                    type="button"
                    className="advanced-filter__clear"
                    onClick={() => handleClearFilter(filter.key)}
                    aria-label={`Clear ${filter.label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {filter.type === 'dateRange' && (
              <div className="advanced-filter__date-range">
                <input
                  type="date"
                  className="advanced-filter__input"
                  placeholder="From"
                  value={values[`${filter.key}_from`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                />
                <span className="advanced-filter__date-separator">to</span>
                <input
                  type="date"
                  className="advanced-filter__input"
                  placeholder="To"
                  value={values[`${filter.key}_to`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                />
              </div>
            )}

            {filter.type === 'number' && (
              <div className="advanced-filter__input-group">
                <input
                  type="number"
                  className="advanced-filter__input"
                  placeholder={filter.placeholder}
                  value={values[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
                {values[filter.key] && (
                  <button
                    type="button"
                    className="advanced-filter__clear"
                    onClick={() => handleClearFilter(filter.key)}
                    aria-label={`Clear ${filter.label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {filter.type === 'boolean' && (
              <div className="advanced-filter__checkbox-group">
                <label className="advanced-filter__checkbox-label">
                  <input
                    type="checkbox"
                    className="advanced-filter__checkbox"
                    checked={values[filter.key] || false}
                    onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                    aria-label={filter.label}
                  />
                  {filter.placeholder || 'Yes'}
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main SearchFilter Component
export function SearchFilter({
  placeholder = 'Search...',
  filters = [],
  onSearch,
  onFilter,
  onClear,
  loading = false,
  showAdvanced = true,
  className = '',
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle search
  useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  // Handle filter changes
  useEffect(() => {
    onFilter(filterValues);
  }, [filterValues, onFilter]);

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilterValues(newFilters);
  }, []);

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setFilterValues({});
  }, []);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setFilterValues({});
    onClear();
  }, [onClear]);

  // Toggle advanced filters
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(!showAdvancedFilters);
  }, [showAdvancedFilters]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.keys(filterValues).filter(key => {
      const value = filterValues[key];
      return value !== '' && value !== null && value !== undefined && value !== false;
    }).length;
  }, [filterValues]);

  // Check if there's any active search or filter
  const hasActiveSearchOrFilter = searchQuery.trim() !== '' || activeFiltersCount > 0;

  return (
    <div className={`search-filter ${className}`}>
      {/* Main Search Bar */}
      <div className="search-filter__main">
        <div className={`
          search-filter__search-group
          ${isSearchFocused ? 'search-filter__search-group--focused' : ''}
          ${loading ? 'search-filter__search-group--loading' : ''}
        `.trim()}>
          <div className="search-filter__search-icon">
            {loading ? (
              <div className="search-filter__spinner"></div>
            ) : (
              <span>🔍</span>
            )}
          </div>
          
          <input
            type="text"
            className="search-filter__search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            disabled={loading}
          />
          
          {searchQuery && (
            <button
              type="button"
              className="search-filter__search-clear"
              onClick={handleSearchClear}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="search-filter__controls">
          {showAdvanced && filters.length > 0 && (
            <button
              type="button"
              className={`
                search-filter__filter-toggle
                ${showAdvancedFilters ? 'search-filter__filter-toggle--active' : ''}
              `.trim()}
              onClick={toggleAdvancedFilters}
            >
              <span className="search-filter__filter-icon">⚙️</span>
              Filters
              {activeFiltersCount > 0 && (
                <span className="search-filter__filter-badge">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {hasActiveSearchOrFilter && (
            <button
              type="button"
              className="search-filter__clear-all"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="search-filter__active-filters">
          <span className="search-filter__active-label">Active filters:</span>
          <div className="search-filter__active-list">
            {Object.entries(filterValues).map(([key, value]) => {
              if (!value || value === '' || value === false) return null;
              
              const filter = filters.find(f => f.key === key || key.startsWith(f.key));
              if (!filter) return null;

              const displayValue = filter.type === 'select' 
                ? filter.options?.find(opt => opt.value === value)?.label || value
                : value.toString();

              return (
                <div key={key} className="search-filter__active-filter">
                  <span className="search-filter__active-filter-label">
                    {filter.label}:
                  </span>
                  <span className="search-filter__active-filter-value">
                    {displayValue}
                  </span>
                  <button
                    type="button"
                    className="search-filter__active-filter-remove"
                    onClick={() => {
                      const newFilters = { ...filterValues };
                      delete newFilters[key];
                      setFilterValues(newFilters);
                    }}
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && showAdvancedFilters && filters.length > 0 && (
        <div className="search-filter__advanced">
          <AdvancedFilter
            filters={filters}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        </div>
      )}
    </div>
  );
}