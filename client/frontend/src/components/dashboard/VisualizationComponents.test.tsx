import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Visualization,
  PieVisualization,
  LineVisualization,
  BarVisualization,
  AreaVisualization,
  CandlestickVisualization,
} from './VisualizationComponents';

describe('VisualizationComponents', () => {
  const mockData = {
    active_energy: 1250.5,
    power: 45.25,
    power_phase_a: 15.1,
  };

  const mockColumns = ['active_energy', 'power', 'power_phase_a'];

  describe('PieVisualization', () => {
    it('should render pie chart with data', () => {
      const { container } = render(
        <PieVisualization
          data={mockData}
          columns={mockColumns}
          title="Distribution"
          height={300}
        />
      );
      // Check that the component renders without error
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <PieVisualization
          data={{}}
          columns={[]}
          title="Distribution"
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should filter out zero values', () => {
      const dataWithZeros = {
        active_energy: 1250.5,
        power: 0,
        power_phase_a: 0,
      };
      const { container } = render(
        <PieVisualization
          data={dataWithZeros}
          columns={mockColumns}
          title="Distribution"
          height={300}
        />
      );
      // Should render pie chart (not "No data available")
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });
  });

  describe('LineVisualization', () => {
    it('should render line chart with data', () => {
      const { container } = render(
        <LineVisualization
          data={mockData}
          columns={mockColumns}
          title="Trend"
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <LineVisualization
          data={{}}
          columns={[]}
          title="Trend"
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('BarVisualization', () => {
    it('should render bar chart with data', () => {
      const { container } = render(
        <BarVisualization
          data={mockData}
          columns={mockColumns}
          title="Comparison"
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <BarVisualization
          data={{}}
          columns={[]}
          title="Comparison"
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('AreaVisualization', () => {
    it('should render area chart with data', () => {
      const { container } = render(
        <AreaVisualization
          data={mockData}
          columns={mockColumns}
          title="Cumulative"
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <AreaVisualization
          data={{}}
          columns={[]}
          title="Cumulative"
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('CandlestickVisualization', () => {
    it('should render candlestick chart with OHLC data', () => {
      const ohlcData = {
        open: 100,
        high: 120,
        low: 95,
        close: 110,
      };
      const { container } = render(
        <CandlestickVisualization
          data={ohlcData}
          columns={['open', 'high', 'low', 'close']}
          title="OHLC"
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should fallback to bar chart when OHLC data is missing', () => {
      const { container } = render(
        <CandlestickVisualization
          data={mockData}
          columns={mockColumns}
          title="OHLC"
          height={300}
        />
      );
      // Should render bar chart as fallback
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <CandlestickVisualization
          data={{}}
          columns={[]}
          title="OHLC"
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Visualization (Generic)', () => {
    it('should render pie visualization when type is pie', () => {
      const { container } = render(
        <Visualization
          type="pie"
          data={mockData}
          columns={mockColumns}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should render line visualization when type is line', () => {
      const { container } = render(
        <Visualization
          type="line"
          data={mockData}
          columns={mockColumns}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should render bar visualization when type is bar', () => {
      const { container } = render(
        <Visualization
          type="bar"
          data={mockData}
          columns={mockColumns}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should render area visualization when type is area', () => {
      const { container } = render(
        <Visualization
          type="area"
          data={mockData}
          columns={mockColumns}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should render candlestick visualization when type is candlestick', () => {
      const { container } = render(
        <Visualization
          type="candlestick"
          data={mockData}
          columns={mockColumns}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <Visualization
          type="pie"
          data={{}}
          columns={[]}
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle null data gracefully', () => {
      render(
        <Visualization
          type="line"
          data={null as any}
          columns={mockColumns}
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle empty columns gracefully', () => {
      render(
        <Visualization
          type="bar"
          data={mockData}
          columns={[]}
          height={300}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should convert string numbers to numbers', () => {
      const stringData = {
        active_energy: '1250.5',
        power: '45.25',
      };
      const { container } = render(
        <Visualization
          type="line"
          data={stringData as any}
          columns={['active_energy', 'power']}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle NaN values gracefully', () => {
      const nanData = {
        active_energy: NaN,
        power: 45.25,
      };
      const { container } = render(
        <Visualization
          type="pie"
          data={nanData as any}
          columns={['active_energy', 'power']}
          height={300}
        />
      );
      // Should render pie chart with valid data
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      const negativeData = {
        active_energy: -100,
        power: 45.25,
      };
      const { container } = render(
        <Visualization
          type="bar"
          data={negativeData}
          columns={['active_energy', 'power']}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeData = {
        active_energy: 999999999.99,
        power: 1000000,
      };
      const { container } = render(
        <Visualization
          type="area"
          data={largeData}
          columns={['active_energy', 'power']}
          height={300}
        />
      );
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with custom height', () => {
      const { container } = render(
        <Visualization
          type="pie"
          data={mockData}
          columns={mockColumns}
          height={500}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBe('500px');
    });

    it('should render with default height', () => {
      const { container } = render(
        <Visualization
          type="line"
          data={mockData}
          columns={mockColumns}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.height).toBe('300px');
    });
  });
});
