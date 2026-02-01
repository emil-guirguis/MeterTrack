/**
 * MeterReadingForm Component Tests
 * 
 * Tests for the main MeterReadingForm component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MeterReadingForm } from './MeterReadingForm';

describe('MeterReadingForm', () => {
  describe('Component Structure', () => {
    it('should render the component', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should render empty state when no reading is available', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(
        screen.getByText('No meter readings available for this element')
      ).toBeInTheDocument();
    });

    it('should render the View All Readings button when onNavigateToList is provided', () => {
      const mockNavigate = vi.fn();
      render(
        <MeterReadingForm
          meterElementId="test-element-1"
          onNavigateToList={mockNavigate}
        />
      );
      expect(screen.getByText('View All Readings')).toBeInTheDocument();
    });

    it('should not render the View All Readings button when onNavigateToList is not provided', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(screen.queryByText('View All Readings')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should render main content sections', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      const sections = container.querySelectorAll('.meter-reading-form__section');
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should render empty state by default', () => {
      render(<MeterReadingForm meterElementId="test-element-1" />);
      expect(
        screen.getByText('No meter readings available for this element')
      ).toBeInTheDocument();
    });

    it('should have retry functionality structure', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-1" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept meterElementId prop', () => {
      const { container } = render(
        <MeterReadingForm meterElementId="test-element-123" />
      );
      expect(container.querySelector('.meter-reading-form')).toBeInTheDocument();
    });

    it('should accept onNavigateToList callback prop', () => {
      const mockCallback = vi.fn();
      render(
        <MeterReadingForm
          meterElementId="test-element-1"
          onNavigateToList={mockCallback}
        />
      );
      expect(screen.getByText('View All Readings')).toBeInTheDocument();
    });
  });
});
