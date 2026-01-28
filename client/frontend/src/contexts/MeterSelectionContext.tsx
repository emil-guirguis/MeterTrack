import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MeterSelectionContextType {
  selectedMeter: string | null;
  selectedElement: string | null;
  selectedMeterName: string | null;
  selectedElementName: string | null;
  selectedElementNumber: number | null;
  setSelectedMeter: (meterId: string | null, meterName?: string | null) => void;
  setSelectedElement: (elementId: string | null, elementName?: string | null, elementNumber?: number | null) => void;
  clearSelection: () => void;
}

const MeterSelectionContext = createContext<MeterSelectionContextType | undefined>(undefined);

export const MeterSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMeter, setSelectedMeterState] = useState<string | null>(null);
  const [selectedElement, setSelectedElementState] = useState<string | null>(null);
  const [selectedMeterName, setSelectedMeterName] = useState<string | null>(null);
  const [selectedElementName, setSelectedElementName] = useState<string | null>(null);
  const [selectedElementNumber, setSelectedElementNumber] = useState<number | null>(null);

  const setSelectedMeter = (meterId: string | null, meterName: string | null = null) => {
    setSelectedMeterState(meterId);
    setSelectedMeterName(meterName || null);
  };

  const setSelectedElement = (elementId: string | null, elementName: string | null = null, elementNumber: number | null = null) => {
    setSelectedElementState(elementId);
    setSelectedElementName(elementName || null);
    setSelectedElementNumber(elementNumber || null);
  };

  const clearSelection = () => {
    setSelectedMeterState(null);
    setSelectedElementState(null);
    setSelectedMeterName(null);
    setSelectedElementName(null);
    setSelectedElementNumber(null);
  };

  return (
    <MeterSelectionContext.Provider
      value={{
        selectedMeter,
        selectedElement,
        selectedMeterName,
        selectedElementName,
        selectedElementNumber,
        setSelectedMeter,
        setSelectedElement,
        clearSelection,
      }}
    >
      {children}
    </MeterSelectionContext.Provider>
  );
};

export const useMeterSelection = () => {
  const context = useContext(MeterSelectionContext);
  if (!context) {
    throw new Error('useMeterSelection must be used within MeterSelectionProvider');
  }
  return context;
};
