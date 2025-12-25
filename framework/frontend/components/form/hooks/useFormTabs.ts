import { useMemo } from 'react';

export interface FormGrouping {
  tabName?: string;
  sectionName?: string;
  tabOrder?: number;
  sectionOrder?: number;
  fieldOrder?: number;
}

export interface FieldDefinition {
  showOn?: string[];
  formGrouping?: FormGrouping;
  label?: string;
  [key: string]: any;
}

export interface TabInfo {
  label: string;
  order: number;
  sections: Record<string, string[]>;
}

export interface UseFormTabsResult {
  tabs: Record<string, TabInfo>;
  tabList: string[];
  fieldSections: Record<string, string[]>;
}

/**
 * Hook for managing form tabs and field organization
 * 
 * Organizes form fields into tabs and sections based on formGrouping metadata.
 * Handles sorting by tab order, section order, and field order.
 * 
 * @param formFields - Object containing field definitions with optional formGrouping metadata
 * @param activeTab - Currently active tab name
 * @returns Object containing organized tabs, tab list, and field sections for active tab
 * 
 * @example
 * ```tsx
 * const { tabs, tabList, fieldSections } = useFormTabs(schema.formFields, activeTab);
 * 
 * // Render tabs
 * {tabList.map(tabName => (
 *   <button key={tabName} onClick={() => setActiveTab(tabName)}>
 *     {tabs[tabName].label}
 *   </button>
 * ))}
 * 
 * // Render fields for active tab
 * {Object.entries(fieldSections).map(([sectionName, fields]) => (
 *   <div key={sectionName}>
 *     <h3>{sectionName}</h3>
 *     {fields.map(fieldName => renderField(fieldName))}
 *   </div>
 * ))}
 * ```
 */
export const useFormTabs = (
  formFields: Record<string, FieldDefinition> | undefined,
  activeTab: string
): UseFormTabsResult => {
  return useMemo(() => {
    if (!formFields) {
      return { tabs: {}, tabList: [], fieldSections: {} };
    }

    interface FieldWithOrder {
      name: string;
      order: number;
    }

    interface TabInfoInternal {
      label: string;
      order: number;
      sections: Record<string, { fields: (string | FieldWithOrder)[]; order: number }>;
    }

    const tabsMap: Record<string, TabInfoInternal> = {};

    // Organize fields by tab and section
    Object.entries(formFields).forEach(([fieldName, fieldDef]) => {
      // Check if field should be shown on form
      const showOn = Array.isArray(fieldDef.showOn) ? fieldDef.showOn : [];
      if (!showOn.includes('form')) {
        return;
      }

      const grouping = fieldDef.formGrouping;

      // Extract grouping properties with defaults
      const {
        tabName = 'Basic',
        sectionName = 'General',
        tabOrder = 1,
        sectionOrder = 1,
        fieldOrder = 999,
      } = grouping || {};

      // Initialize tab if not exists
      if (!tabsMap[tabName]) {
        tabsMap[tabName] = {
          label: tabName,
          order: tabOrder,
          sections: {},
        };
      }

      // Initialize section if not exists
      if (!tabsMap[tabName].sections[sectionName]) {
        tabsMap[tabName].sections[sectionName] = {
          fields: [],
          order: sectionOrder,
        };
      }

      // Add field to section with order info
      tabsMap[tabName].sections[sectionName].fields.push({
        name: fieldName,
        order: fieldOrder,
      });
    });

    // Sort tabs by order and build final structure
    const sortedTabsList = Object.entries(tabsMap)
      .sort(([, a], [, b]) => a.order - b.order);

    const sortedTabs: Record<string, TabInfo> = {};
    sortedTabsList.forEach(([tabName, tab]) => {
      // Sort sections within tab
      const sortedSections = Object.entries(tab.sections)
        .sort(([, a], [, b]) => a.order - b.order)
        .reduce((sectionAcc, [sectionName, section]) => {
          // Sort fields within section by fieldOrder
          const sortedFields = (section.fields as FieldWithOrder[])
            .sort((a, b) => a.order - b.order)
            .map(f => f.name);

          sectionAcc[sectionName] = sortedFields;
          return sectionAcc;
        }, {} as Record<string, string[]>);

      sortedTabs[tabName] = {
        label: tab.label,
        order: tab.order,
        sections: sortedSections,
      };
    });

    // Build field sections for current tab
    const currentTabSections: Record<string, string[]> = {};
    if (sortedTabs[activeTab]) {
      Object.assign(currentTabSections, sortedTabs[activeTab].sections);
    }

    // Get sorted tab list
    const tabList = Object.entries(sortedTabs)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([tabName]) => tabName);

    return { tabs: sortedTabs, tabList, fieldSections: currentTabSections };
  }, [formFields, activeTab]);
};

export default useFormTabs;
