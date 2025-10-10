import React, { useState } from 'react';
import './MeterDataRetriever.css';

export const MeterDataRetrieverTest: React.FC = () => {
  const [testData, setTestData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTestClick = () => {
    // Clear existing data first
    setTestData([]);
    setLoading(true);
    
    // Simulate data loading with comprehensive meter fields
    setTimeout(() => {
      setTestData([
        // Basic meter readings
        { name: 'voltage', value: 480.2, unit: 'V', address: 0, type: 'Basic' },
        { name: 'current', value: 125.8, unit: 'A', address: 2, type: 'Basic' },
        { name: 'power', value: 85600, unit: 'W', address: 4, type: 'Basic' },
        { name: 'energy', value: 15420500, unit: 'Wh', address: 6, type: 'Basic' },
        { name: 'frequency', value: 60.0, unit: 'Hz', address: 8, type: 'Basic' },
        { name: 'powerFactor', value: 0.95, unit: '', address: 10, type: 'Basic' },
        
        // Holding register fields (like your scan data)
        { name: 'holding_0_1_hi', value: 2, unit: '', address: 0, type: 'Holding (Hi Word)' },
        { name: 'holding_0_1_lo', value: 0, unit: '', address: 1, type: 'Holding (Lo Word)' },
        { name: 'holding_0_1_u32', value: 131072, unit: '', address: 0, type: 'Holding (32-bit Uint)' },
        { name: 'holding_0_1_beFloat', value: 1.8367099231598242e-40, unit: '', address: 0, type: 'Holding (Float BE)' },
        { name: 'holding_0_1_leFloat', value: 2.802596928649634e-45, unit: '', address: 0, type: 'Holding (Float LE)' },
        
        { name: 'holding_2_3_hi', value: 1, unit: '', address: 2, type: 'Holding (Hi Word)' },
        { name: 'holding_2_3_lo', value: 1, unit: '', address: 3, type: 'Holding (Lo Word)' },
        { name: 'holding_2_3_u32', value: 65537, unit: '', address: 2, type: 'Holding (32-bit Uint)' },
        { name: 'holding_2_3_beFloat', value: 9.183689745645554e-41, unit: '', address: 2, type: 'Holding (Float BE)' },
        { name: 'holding_2_3_leFloat', value: 9.183689745645554e-41, unit: '', address: 2, type: 'Holding (Float LE)' },
        
        { name: 'holding_4_5_hi', value: 13, unit: '', address: 4, type: 'Holding (Hi Word)' },
        { name: 'holding_4_5_lo', value: 2020, unit: '', address: 5, type: 'Holding (Lo Word)' },
        { name: 'holding_4_5_u32', value: 853988, unit: '', address: 4, type: 'Holding (32-bit Uint)' },
        { name: 'holding_4_5_beFloat', value: 1.1966920729518219e-39, unit: '', address: 4, type: 'Holding (Float BE)' },
        { name: 'holding_4_5_leFloat', value: 3.430565698093389e-34, unit: '', address: 4, type: 'Holding (Float LE)' },
        
        { name: 'holding_6_7_hi', value: 2509, unit: '', address: 6, type: 'Holding (Hi Word)' },
        { name: 'holding_6_7_lo', value: 2511, unit: '', address: 7, type: 'Holding (Lo Word)' },
        { name: 'holding_6_7_u32', value: 164432335, unit: '', address: 6, type: 'Holding (32-bit Uint)' },
        { name: 'holding_6_7_beFloat', value: 4.936117878215703e-33, unit: '', address: 6, type: 'Holding (Float BE)' },
        { name: 'holding_6_7_leFloat', value: 4.9842653921414144e-33, unit: '', address: 6, type: 'Holding (Float LE)' },
        
        { name: 'holding_8_9_hi', value: 92, unit: '', address: 8, type: 'Holding (Hi Word)' },
        { name: 'holding_8_9_lo', value: 3, unit: '', address: 9, type: 'Holding (Lo Word)' },
        { name: 'holding_8_9_u32', value: 6029315, unit: '', address: 8, type: 'Holding (32-bit Uint)' },
        { name: 'holding_8_9_beFloat', value: 8.448869850430584e-39, unit: '', address: 8, type: 'Holding (Float BE)' },
        { name: 'holding_8_9_leFloat', value: 2.756354079326915e-40, unit: '', address: 8, type: 'Holding (Float LE)' },
        
        { name: 'holding_10_11_hi', value: 0, unit: '', address: 10, type: 'Holding (Hi Word)' },
        { name: 'holding_10_11_lo', value: 0, unit: '', address: 11, type: 'Holding (Lo Word)' },
        { name: 'holding_10_11_u32', value: 0, unit: '', address: 10, type: 'Holding (32-bit Uint)' },
        { name: 'holding_10_11_beFloat', value: 0, unit: '', address: 10, type: 'Holding (Float BE)' },
        { name: 'holding_10_11_leFloat', value: 0, unit: '', address: 10, type: 'Holding (Float LE)' },
        
        { name: 'holding_12_13_hi', value: 1997, unit: '', address: 12, type: 'Holding (Hi Word)' },
        { name: 'holding_12_13_lo', value: 32768, unit: '', address: 13, type: 'Holding (Lo Word)' },
        { name: 'holding_12_13_u32', value: 130908160, unit: '', address: 12, type: 'Holding (32-bit Uint)' },
        { name: 'holding_12_13_beFloat', value: 3.092020340402945e-34, unit: '', address: 12, type: 'Holding (Float BE)' },
        { name: 'holding_12_13_leFloat', value: -2.7983930332566597e-42, unit: '', address: 12, type: 'Holding (Float LE)' },
        
        { name: 'holding_14_15_hi', value: 32768, unit: '', address: 14, type: 'Holding (Hi Word)' },
        { name: 'holding_14_15_lo', value: 3763, unit: '', address: 15, type: 'Holding (Lo Word)' },
        { name: 'holding_14_15_u32', value: -2147479885, unit: '', address: 14, type: 'Holding (32-bit Uint)' },
        { name: 'holding_14_15_beFloat', value: -5.2730861212542866e-42, unit: '', address: 14, type: 'Holding (Float BE)' },
        { name: 'holding_14_15_leFloat', value: 4.425016640224113e-30, unit: '', address: 14, type: 'Holding (Float LE)' },
        
        // Input register fields
        { name: 'input_0_1_hi', value: 0, unit: '', address: 0, type: 'Input (Hi Word)' },
        { name: 'input_0_1_lo', value: 0, unit: '', address: 1, type: 'Input (Lo Word)' },
        { name: 'input_0_1_u32', value: 0, unit: '', address: 0, type: 'Input (32-bit Uint)' },
        { name: 'input_0_1_beFloat', value: 0, unit: '', address: 0, type: 'Input (Float BE)' },
        { name: 'input_0_1_leFloat', value: 0, unit: '', address: 0, type: 'Input (Float LE)' },
        
        { name: 'input_10_11_hi', value: 4066, unit: '', address: 10, type: 'Input (Hi Word)' },
        { name: 'input_10_11_lo', value: 13510, unit: '', address: 11, type: 'Input (Lo Word)' },
        { name: 'input_10_11_u32', value: 266482886, unit: '', address: 10, type: 'Input (32-bit Uint)' },
        { name: 'input_10_11_beFloat', value: 2.2305648161203483e-29, unit: '', address: 10, type: 'Input (Float BE)' },
        { name: 'input_10_11_leFloat', value: 3.689193022182735e-7, unit: '', address: 10, type: 'Input (Float LE)' },
        
        { name: 'input_12_13_hi', value: 151, unit: '', address: 12, type: 'Input (Hi Word)' },
        { name: 'input_12_13_lo', value: 10756, unit: '', address: 13, type: 'Input (Lo Word)' },
        { name: 'input_12_13_u32', value: 9906692, unit: '', address: 12, type: 'Input (32-bit Uint)' },
        { name: 'input_12_13_beFloat', value: 1.388223228613895e-38, unit: '', address: 12, type: 'Input (Float BE)' },
        { name: 'input_12_13_leFloat', value: 1.172415978320171e-13, unit: '', address: 12, type: 'Input (Float LE)' },
        
        { name: 'input_14_15_hi', value: 1104, unit: '', address: 14, type: 'Input (Hi Word)' },
        { name: 'input_14_15_lo', value: 3318, unit: '', address: 15, type: 'Input (Lo Word)' },
        { name: 'input_14_15_u32', value: 72355062, unit: '', address: 14, type: 'Input (32-bit Uint)' },
        { name: 'input_14_15_beFloat', value: 2.4456233867733506e-36, unit: '', address: 14, type: 'Input (Float BE)' },
        { name: 'input_14_15_leFloat', value: 3.7904896797067417e-31, unit: '', address: 14, type: 'Input (Float LE)' }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="meter-data-retriever">
      <div className="meter-data-retriever__header">
        <div className="meter-data-retriever__title-section">
          <h2 className="meter-data-retriever__title">
            <span className="meter-data-retriever__icon">📊</span>
            Live Meter Data Test
          </h2>
          <p className="meter-data-retriever__subtitle">
            Test component for meter data retrieval
          </p>
        </div>
        
        <div className="meter-data-retriever__controls">
          <button
            type="button"
            className="meter-data-retriever__btn meter-data-retriever__btn--primary"
            onClick={handleTestClick}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="meter-data-retriever__spinner"></span>
                Loading...
              </>
            ) : (
              <>
                <span className="meter-data-retriever__btn-icon">🔄</span>
                Get Test Data
              </>
            )}
          </button>
        </div>
      </div>

      <div className="meter-data-retriever__content">
        {testData.length === 0 ? (
          <div className="meter-data-grid__empty">
            <p>No data available. Click "Get Test Data" to see sample meter data.</p>
          </div>
        ) : (
          <div className="meter-data-grid">
            <div className="meter-data-grid__header">
              <div className="meter-data-grid__cell meter-data-grid__cell--header">Parameter</div>
              <div className="meter-data-grid__cell meter-data-grid__cell--header">Value</div>
              <div className="meter-data-grid__cell meter-data-grid__cell--header">Unit</div>
              <div className="meter-data-grid__cell meter-data-grid__cell--header">Address</div>
              <div className="meter-data-grid__cell meter-data-grid__cell--header">Type</div>
            </div>
            <div className="meter-data-grid__body">
              {testData.map((item, index) => (
                <div key={index} className="meter-data-grid__row">
                  <div className="meter-data-grid__cell meter-data-grid__cell--name">
                    {item.name}
                  </div>
                  <div className="meter-data-grid__cell meter-data-grid__cell--value">
                    {typeof item.value === 'number' ? item.value.toFixed(3) : item.value}
                  </div>
                  <div className="meter-data-grid__cell meter-data-grid__cell--unit">
                    {item.unit || '-'}
                  </div>
                  <div className="meter-data-grid__cell meter-data-grid__cell--address">
                    {item.address !== undefined ? item.address : '-'}
                  </div>
                  <div className="meter-data-grid__cell meter-data-grid__cell--type">
                    {item.type || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterDataRetrieverTest;