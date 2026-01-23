import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MeterSelectionContextType {
  selectedMeter: string | null;
  selectedElement: string | null;
  setSelectedMeter: (meterId: string | null) => void;
  setSelectedElement: (elementId: string | null) => void;
  clearSelection: () => void;
}

const MeterSelectionContext = createContext<MeterSelectionContextType | undefined>(undefined);

export const MeterSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedMeter(null);
    setSelectedElement(null);
  };

  return (
    <MeterSelectionContext.Provider
      value={{
        selectedMeter,
        selectedElement,
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
